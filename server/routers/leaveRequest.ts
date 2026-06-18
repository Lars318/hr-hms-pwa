import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import {
  createNotification,
  createNotificationsForRoles,
  createNotificationsForDepartment,
} from "@/lib/notifications";
import type { Prisma, LeaveRequestStatus } from "@prisma/client";

const leaveTypes = [
  "VACATION", "SICK_LEAVE", "CARE_LEAVE", "EGENMELDING",
  "PARENTAL_LEAVE", "UNPAID_LEAVE", "OTHER",
] as const;

// Egenmelding rules: 4 instances × 3 days = 12 days total per calendar year.
// Each instance counts as 3 days regardless of actual days registered.
const EGENMELDING_MAX_INSTANCES = 4;
const EGENMELDING_DAYS_PER_INSTANCE = 3;
// Default ferie quota (25 working days = 5 weeks)
const FERIE_DAYS_PER_YEAR = 25;
// Default omsorgsfravær quota (10 days per year, 20 if more than 2 children)
const OMSORG_DAYS_PER_YEAR = 10;

const leaveStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

const leaveInclude = {
  employee: { select: { id: true, fullName: true, email: true } },
  department: { select: { id: true, name: true } },
  decidedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.LeaveRequestInclude;

function canManage(role: string) {
  return role === "ADMIN" || role === "HR" || role === "MANAGER";
}

export const leaveRequestRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        status: z.enum(leaveStatuses).optional(),
        type: z.enum(leaveTypes).optional(),
        employeeId: z.string().optional(),
        departmentId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      let visibilityWhere: Prisma.LeaveRequestWhereInput = {};
      if (!isHrAdmin) {
        if (profile.role === "MANAGER" && profile.departmentId) {
          visibilityWhere = { departmentId: profile.departmentId };
        } else {
          visibilityWhere = { employeeId: profile.id };
        }
      }

      return db.leaveRequest.findMany({
        where: {
          ...visibilityWhere,
          ...(input.status ? { status: input.status } : {}),
          ...(input.type ? { type: input.type } : {}),
          ...(input.employeeId && isHrAdmin ? { employeeId: input.employeeId } : {}),
          ...(input.departmentId && isHrAdmin ? { departmentId: input.departmentId } : {}),
          ...(input.from ? { startDate: { gte: new Date(input.from) } } : {}),
          ...(input.to ? { endDate: { lte: new Date(input.to) } } : {}),
        },
        include: leaveInclude,
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
      });
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const req = await db.leaveRequest.findUnique({
        where: { id: input.id },
        include: leaveInclude,
      });
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Søknad ikke funnet." });

      const canView =
        profile.role === "ADMIN" ||
        profile.role === "HR" ||
        req.employeeId === profile.id ||
        (profile.role === "MANAGER" && req.departmentId === profile.departmentId);

      if (!canView) throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til denne søknaden." });
      return req;
    }),

  // ── create ────────────────────────────────────────────────────────────────
  create: profileProcedure
    .input(
      z.object({
        type: z.enum(leaveTypes),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        locationId: z.string().optional(),
        reason: z.string().max(1000).optional(),
      }).refine(
        (v) => new Date(v.startDate) <= new Date(v.endDate),
        { message: "Startdato må være før eller lik sluttdato.", path: ["endDate"] }
      ).refine(
        (v) => (v.type === "OTHER" || v.type === "UNPAID_LEAVE") ? !!v.reason?.trim() : true,
        { message: "Begrunnelse er påkrevd for denne fraværstypen.", path: ["reason"] }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

      // Resolve locationId: input → primary assignment → null
      let resolvedLocationId = input.locationId ?? null;
      if (!resolvedLocationId) {
        const primary = await db.profileAssignment.findFirst({
          where: { profileId: profile.id, isPrimary: true, endDate: null },
          select: { locationId: true },
        });
        resolvedLocationId = primary?.locationId ?? null;
      }

      const req = await db.leaveRequest.create({
        data: {
          type: input.type,
          status: "PENDING",
          startDate: start,
          endDate: end,
          days,
          reason: input.reason ?? null,
          employeeId: profile.id,
          departmentId: profile.departmentId ?? null,
          locationId: resolvedLocationId,
        },
        include: leaveInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "LeaveRequest",
          entityId: req.id,
          action: "LEAVE_REQUEST_CREATED",
          actorId: profile.id,
          metadata: { type: req.type, startDate: req.startDate, endDate: req.endDate, days },
        },
      });

      // Varsle leder for avdelingen; fall back til HR/ADMIN
      if (req.departmentId) {
        await createNotificationsForDepartment({
          db,
          departmentId: req.departmentId,
          roles: ["MANAGER"],
          type: "LEAVE_REQUEST_CREATED",
          title: "Ny fraværssøknad til godkjenning",
          message: `${profile.fullName} søker om ${TYPE_LABELS[input.type].toLowerCase()} (${days} dag${days !== 1 ? "er" : ""})`,
          linkUrl: `/fravaer/${req.id}`,
          excludeProfileId: profile.id,
        });
      } else {
        await createNotificationsForRoles({
          db,
          roles: ["ADMIN", "HR"],
          type: "LEAVE_REQUEST_CREATED",
          title: "Ny fraværssøknad til godkjenning",
          message: `${profile.fullName} søker om ${TYPE_LABELS[input.type].toLowerCase()} (${days} dag${days !== 1 ? "er" : ""})`,
          linkUrl: `/fravaer/${req.id}`,
          excludeProfileId: profile.id,
        });
      }

      return req;
    }),

  // ── update (PENDING only) ─────────────────────────────────────────────────
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(leaveTypes).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        reason: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const req = await db.leaveRequest.findUnique({ where: { id: input.id } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Søknad ikke funnet." });
      if (req.status !== "PENDING") throw new TRPCError({ code: "FORBIDDEN", message: "Kun PENDING søknader kan redigeres." });

      const canEdit =
        req.employeeId === profile.id ||
        profile.role === "ADMIN" ||
        profile.role === "HR";

      if (!canEdit) throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til å redigere denne søknaden." });

      const start = input.startDate ? new Date(input.startDate) : req.startDate;
      const end = input.endDate ? new Date(input.endDate) : req.endDate;

      if (start > end) throw new TRPCError({ code: "BAD_REQUEST", message: "Startdato må være før eller lik sluttdato." });

      const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
      const type = input.type ?? req.type;

      if ((type === "OTHER" || type === "UNPAID_LEAVE") && !input.reason?.trim() && !req.reason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Begrunnelse er påkrevd for denne fraværstypen." });
      }

      const updated = await db.leaveRequest.update({
        where: { id: input.id },
        data: {
          ...(input.type ? { type: input.type } : {}),
          startDate: start,
          endDate: end,
          days,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
        },
        include: leaveInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "LeaveRequest",
          entityId: req.id,
          action: "LEAVE_REQUEST_UPDATED",
          actorId: profile.id,
          metadata: { updatedFields: Object.keys(input).filter((k) => k !== "id") },
        },
      });

      return updated;
    }),

  // ── approve ───────────────────────────────────────────────────────────────
  approve: profileProcedure
    .input(z.object({ id: z.string(), managerComment: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const req = await db.leaveRequest.findUnique({ where: { id: input.id } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Søknad ikke funnet." });
      if (req.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Kun PENDING søknader kan godkjennes." });

      // Manager kan ikke godkjenne sin egen søknad
      if (req.employeeId === profile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du kan ikke godkjenne din egen søknad." });
      }
      // Manager kan kun godkjenne søknader i sin avdeling
      if (
        profile.role === "MANAGER" &&
        req.departmentId !== profile.departmentId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til å godkjenne denne søknaden." });
      }

      const updated = await db.leaveRequest.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          decidedById: profile.id,
          decidedAt: new Date(),
          managerComment: input.managerComment ?? null,
        },
        include: leaveInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "LeaveRequest",
          entityId: req.id,
          action: "LEAVE_REQUEST_APPROVED",
          actorId: profile.id,
          metadata: { managerComment: input.managerComment },
        },
      });

      await createNotification({
        db,
        recipientId: req.employeeId,
        type: "LEAVE_REQUEST_APPROVED",
        title: "Fraværssøknad godkjent",
        message: `Din søknad om ${TYPE_LABELS[req.type].toLowerCase()} (${req.days} dag${req.days !== 1 ? "er" : ""}) er godkjent`,
        linkUrl: `/fravaer/${req.id}`,
      });

      return updated;
    }),

  // ── reject ────────────────────────────────────────────────────────────────
  reject: profileProcedure
    .input(z.object({ id: z.string(), managerComment: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const req = await db.leaveRequest.findUnique({ where: { id: input.id } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Søknad ikke funnet." });
      if (req.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Kun PENDING søknader kan avslås." });

      if (req.employeeId === profile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du kan ikke avslå din egen søknad." });
      }
      if (
        profile.role === "MANAGER" &&
        req.departmentId !== profile.departmentId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til å avslå denne søknaden." });
      }

      const updated = await db.leaveRequest.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          decidedById: profile.id,
          decidedAt: new Date(),
          managerComment: input.managerComment ?? null,
        },
        include: leaveInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "LeaveRequest",
          entityId: req.id,
          action: "LEAVE_REQUEST_REJECTED",
          actorId: profile.id,
          metadata: { managerComment: input.managerComment },
        },
      });

      await createNotification({
        db,
        recipientId: req.employeeId,
        type: "LEAVE_REQUEST_REJECTED",
        title: "Fraværssøknad avslått",
        message: `Din søknad om ${TYPE_LABELS[req.type].toLowerCase()} (${req.days} dag${req.days !== 1 ? "er" : ""}) er avslått`,
        linkUrl: `/fravaer/${req.id}`,
      });

      return updated;
    }),

  // ── calendar ──────────────────────────────────────────────────────────────
  calendar: profileProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12).optional(),
        departmentId: z.string().optional(),
        status: z.array(z.enum(leaveStatuses)).optional(),
        type: z.array(z.enum(leaveTypes)).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      let visibilityWhere: Prisma.LeaveRequestWhereInput = {};
      if (!isHrAdmin) {
        if (profile.role === "MANAGER" && profile.departmentId) {
          visibilityWhere = { departmentId: profile.departmentId };
        } else {
          visibilityWhere = { employeeId: profile.id };
        }
      }

      // Period boundaries
      const periodStart = input.month
        ? new Date(input.year, input.month - 1, 1)
        : new Date(input.year, 0, 1);
      const periodEnd = input.month
        ? new Date(input.year, input.month, 0, 23, 59, 59, 999)
        : new Date(input.year, 11, 31, 23, 59, 59, 999);

      // Default: only show PENDING and APPROVED on calendar
      const statusFilter =
        input.status && input.status.length > 0
          ? input.status
          : (["PENDING", "APPROVED"] as LeaveRequestStatus[]);

      return db.leaveRequest.findMany({
        where: {
          ...visibilityWhere,
          // Overlap: request overlaps period if startDate <= periodEnd AND endDate >= periodStart
          startDate: { lte: periodEnd },
          endDate: { gte: periodStart },
          status: { in: statusFilter },
          ...(input.type?.length ? { type: { in: input.type } } : {}),
          ...(input.departmentId && isHrAdmin ? { departmentId: input.departmentId } : {}),
        },
        include: leaveInclude,
        orderBy: [{ startDate: "asc" }],
      });
    }),

  // ── balance ───────────────────────────────────────────────────────────────
  balance: profileProcedure
    .input(z.object({ employeeId: z.string().optional(), year: z.number().int().min(2020).max(2100).optional() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      const targetId = input.employeeId && isHrAdmin ? input.employeeId : profile.id;
      const year = input.year ?? new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      const requests = await db.leaveRequest.findMany({
        where: {
          employeeId: targetId,
          status: { in: ["APPROVED", "PENDING"] },
          startDate: { gte: yearStart, lte: yearEnd },
          type: { in: ["EGENMELDING", "CARE_LEAVE", "VACATION"] },
        },
        select: { type: true, days: true, startDate: true },
        orderBy: { startDate: "asc" },
      });

      // Egenmelding: count instances (not days), each = 3 days
      const egenmeldingInstances = requests.filter((r) => r.type === "EGENMELDING").length;
      const egenmeldingDaysUsed = egenmeldingInstances * EGENMELDING_DAYS_PER_INSTANCE;
      const egenmeldingInstancesRemaining = Math.max(0, EGENMELDING_MAX_INSTANCES - egenmeldingInstances);

      // Omsorgsfravær: count actual days
      const omsorgsfravaerDaysUsed = requests
        .filter((r) => r.type === "CARE_LEAVE")
        .reduce((sum, r) => sum + r.days, 0);

      // Ferie: count actual days
      const ferieDaysUsed = requests
        .filter((r) => r.type === "VACATION")
        .reduce((sum, r) => sum + r.days, 0);

      return {
        year,
        egenmelding: {
          instancesUsed: egenmeldingInstances,
          instancesRemaining: egenmeldingInstancesRemaining,
          daysUsed: egenmeldingDaysUsed,
          daysPerInstance: EGENMELDING_DAYS_PER_INSTANCE,
          maxInstances: EGENMELDING_MAX_INSTANCES,
        },
        omsorgsfravær: {
          daysUsed: omsorgsfravaerDaysUsed,
          daysRemaining: Math.max(0, OMSORG_DAYS_PER_YEAR - omsorgsfravaerDaysUsed),
          quota: OMSORG_DAYS_PER_YEAR,
        },
        ferie: {
          daysUsed: ferieDaysUsed,
          daysRemaining: Math.max(0, FERIE_DAYS_PER_YEAR - ferieDaysUsed),
          quota: FERIE_DAYS_PER_YEAR,
        },
      };
    }),

  // ── cancel ────────────────────────────────────────────────────────────────
  cancel: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const req = await db.leaveRequest.findUnique({ where: { id: input.id } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Søknad ikke funnet." });
      if (req.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Kun PENDING søknader kan kanselleres." });

      const canCancel =
        req.employeeId === profile.id ||
        profile.role === "ADMIN" ||
        profile.role === "HR";

      if (!canCancel) throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til å kansellere denne søknaden." });

      const updated = await db.leaveRequest.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
        include: leaveInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "LeaveRequest",
          entityId: req.id,
          action: "LEAVE_REQUEST_CANCELLED",
          actorId: profile.id,
          metadata: {},
        },
      });

      // Varsle leder/HR hvis søknaden hadde en avdeling
      if (req.departmentId) {
        await createNotificationsForDepartment({
          db,
          departmentId: req.departmentId,
          roles: ["MANAGER"],
          type: "LEAVE_REQUEST_CANCELLED",
          title: "Fraværssøknad kansellert",
          message: `${updated.employee.fullName} kansellerte sin søknad om ${TYPE_LABELS[req.type].toLowerCase()}`,
          linkUrl: `/fravaer/${req.id}`,
          excludeProfileId: profile.id,
        });
      } else {
        await createNotificationsForRoles({
          db,
          roles: ["ADMIN", "HR"],
          type: "LEAVE_REQUEST_CANCELLED",
          title: "Fraværssøknad kansellert",
          message: `${updated.employee.fullName} kansellerte sin søknad om ${TYPE_LABELS[req.type].toLowerCase()}`,
          linkUrl: `/fravaer/${req.id}`,
          excludeProfileId: profile.id,
        });
      }

      return updated;
    }),
});

const TYPE_LABELS: Record<string, string> = {
  VACATION: "Ferie",
  SICK_LEAVE: "Sykemelding",
  CARE_LEAVE: "Omsorgsfravær",
  EGENMELDING: "Egenmelding",
  PARENTAL_LEAVE: "Foreldrepermisjon",
  UNPAID_LEAVE: "Permisjon uten lønn",
  OTHER: "Annet fravær",
};
