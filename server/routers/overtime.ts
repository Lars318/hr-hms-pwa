import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { createNotificationsForRoles } from "@/lib/notifications";

const overtimeTypes = ["OVERTIME", "TIME_OFF", "ON_CALL", "TRAVEL_TIME"] as const;
const overtimeStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"] as const;

export const overtimeRouter = router({
  // ── list (HR/ADMIN/MANAGER see all/team; EMPLOYEE sees own) ────────────────
  list: profileProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        status: z.enum(overtimeStatuses).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        locationId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isManager = profile.role === "MANAGER";

      return db.overtimeEntry.findMany({
        where: {
          ...(isHrAdmin
            ? {
                ...(input?.employeeId ? { employeeId: input.employeeId } : {}),
                ...(input?.locationId ? { locationId: input.locationId } : {}),
              }
            : isManager
            ? { employee: { departmentId: profile.departmentId } }
            : { employeeId: profile.id }),
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.from || input?.to
            ? {
                date: {
                  ...(input?.from ? { gte: new Date(input.from) } : {}),
                  ...(input?.to ? { lte: new Date(input.to + "T23:59:59.999Z") } : {}),
                },
              }
            : {}),
        },
        include: {
          employee: { select: { id: true, fullName: true, title: true } },
          approvedBy: { select: { id: true, fullName: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
    }),

  // ── myEntries ──────────────────────────────────────────────────────────────
  myEntries: profileProcedure
    .input(
      z.object({
        status: z.enum(overtimeStatuses).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      return db.overtimeEntry.findMany({
        where: {
          employeeId: profile.id,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.from || input?.to
            ? {
                date: {
                  ...(input?.from ? { gte: new Date(input.from) } : {}),
                  ...(input?.to ? { lte: new Date(input.to + "T23:59:59.999Z") } : {}),
                },
              }
            : {}),
        },
        include: {
          approvedBy: { select: { id: true, fullName: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      });
    }),

  // ── byId ───────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const entry = await db.overtimeEntry.findUnique({
        where: { id: input.id },
        include: {
          employee: { select: { id: true, fullName: true, title: true, departmentId: true } },
          approvedBy: { select: { id: true, fullName: true } },
          location: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isManager = profile.role === "MANAGER" && profile.departmentId === entry.employee.departmentId;
      const isOwner = entry.employeeId === profile.id;

      if (!isHrAdmin && !isManager && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return entry;
    }),

  // ── myBalance ──────────────────────────────────────────────────────────────
  myBalance: profileProcedure.query(async ({ ctx }) => {
    const { profile, db } = ctx;
    return computeBalance(db, profile.id);
  }),

  balanceByEmployee: hrProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return computeBalance(ctx.db, input.employeeId);
    }),

  // ── create ─────────────────────────────────────────────────────────────────
  create: profileProcedure
    .input(
      z.object({
        date: z.string(),
        hours: z.number().positive().max(24),
        type: z.enum(overtimeTypes),
        description: z.string().max(1000).optional(),
        locationId: z.string().optional(),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      let resolvedLocationId = input.locationId ?? null;
      if (!resolvedLocationId) {
        const primary = await db.profileAssignment.findFirst({
          where: { profileId: profile.id, isPrimary: true, endDate: null },
          select: { locationId: true },
        });
        resolvedLocationId = primary?.locationId ?? null;
      }

      return db.overtimeEntry.create({
        data: {
          employeeId: profile.id,
          date: new Date(input.date),
          hours: input.hours,
          type: input.type,
          description: input.description,
          status: "DRAFT",
          locationId: resolvedLocationId,
          departmentId: input.departmentId ?? profile.departmentId ?? null,
        },
      });
    }),

  // ── update ─────────────────────────────────────────────────────────────────
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        hours: z.number().positive().max(24).optional(),
        type: z.enum(overtimeTypes).optional(),
        description: z.string().max(1000).optional().nullable(),
        locationId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const entry = await db.overtimeEntry.findUnique({ where: { id: input.id } });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (entry.employeeId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["DRAFT", "REJECTED"].includes(entry.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan ikke redigere innsendt registrering." });
      }

      return db.overtimeEntry.update({
        where: { id: input.id },
        data: {
          ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
          ...(input.hours !== undefined ? { hours: input.hours } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
        },
      });
    }),

  // ── submit ─────────────────────────────────────────────────────────────────
  submit: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const entry = await db.overtimeEntry.findUnique({ where: { id: input.id } });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (entry.employeeId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["DRAFT", "REJECTED"].includes(entry.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Registreringen kan ikke sendes inn." });
      }

      const updated = await db.overtimeEntry.update({
        where: { id: input.id },
        data: { status: "SUBMITTED" },
      });

      await createNotificationsForRoles({
        db,
        roles: ["ADMIN", "HR", "MANAGER"],
        type: "OVERTIME_SUBMITTED",
        title: "Ny overtidsregistrering til godkjenning",
        message: `${profile.fullName} har sendt inn overtid/avspasering for godkjenning`,
        linkUrl: `/overtid/${input.id}`,
        excludeProfileId: profile.id,
      });

      return updated;
    }),

  // ── approve ────────────────────────────────────────────────────────────────
  approve: profileProcedure
    .input(z.object({ id: z.string(), note: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isManager = profile.role === "MANAGER";
      if (!isHrAdmin && !isManager) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await db.overtimeEntry.findUnique({
        where: { id: input.id },
        include: { employee: { select: { id: true, fullName: true, departmentId: true } } },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (entry.status !== "SUBMITTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Bare innsendte registreringer kan godkjennes." });
      }

      const updated = await db.overtimeEntry.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedById: profile.id,
          approvedAt: new Date(),
          note: input.note ?? null,
        },
      });

      await db.notification.create({
        data: {
          recipientId: entry.employeeId,
          type: "OVERTIME_APPROVED",
          title: "Overtid godkjent",
          message: `Din overtidsregistrering er godkjent av ${profile.fullName}`,
          linkUrl: `/overtid/${input.id}`,
        },
      });

      return updated;
    }),

  // ── reject ─────────────────────────────────────────────────────────────────
  reject: profileProcedure
    .input(z.object({ id: z.string(), note: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isManager = profile.role === "MANAGER";
      if (!isHrAdmin && !isManager) throw new TRPCError({ code: "FORBIDDEN" });

      const entry = await db.overtimeEntry.findUnique({ where: { id: input.id } });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (entry.status !== "SUBMITTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Bare innsendte registreringer kan avslås." });
      }

      const updated = await db.overtimeEntry.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          approvedById: profile.id,
          approvedAt: new Date(),
          note: input.note,
        },
      });

      await db.notification.create({
        data: {
          recipientId: entry.employeeId,
          type: "OVERTIME_REJECTED",
          title: "Overtid avslått",
          message: `Din overtidsregistrering er avslått: ${input.note}`,
          linkUrl: `/overtid/${input.id}`,
        },
      });

      return updated;
    }),

  // ── cancel ─────────────────────────────────────────────────────────────────
  cancel: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const entry = await db.overtimeEntry.findUnique({ where: { id: input.id } });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (entry.employeeId !== profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!["DRAFT", "SUBMITTED"].includes(entry.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan ikke kansellere denne registreringen." });
      }

      return db.overtimeEntry.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  // ── createAdjustment (HR only) ─────────────────────────────────────────────
  createAdjustment: hrProcedure
    .input(
      z.object({
        employeeId: z.string(),
        hours: z.number(),
        reason: z.enum(["CORRECTION", "PAYOUT", "RESET", "MANUAL"]),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      return db.timeBankAdjustment.create({
        data: {
          employeeId: input.employeeId,
          adjustedById: profile.id,
          hours: input.hours,
          reason: input.reason,
          note: input.note,
        },
      });
    }),

  adjustments: hrProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.timeBankAdjustment.findMany({
        where: { employeeId: input.employeeId },
        include: { adjustedBy: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),
});

async function computeBalance(db: PrismaClient, employeeId: string) {
  const [entries, adjustments] = await Promise.all([
    db.overtimeEntry.findMany({
      where: { employeeId, status: "APPROVED" },
      select: { hours: true, type: true },
    }),
    db.timeBankAdjustment.findMany({
      where: { employeeId },
      select: { hours: true },
    }),
  ]);

  const earnedHours = entries
    .filter((e) => e.type !== "TIME_OFF")
    .reduce((sum, e) => sum + e.hours, 0);
  const usedHours = entries
    .filter((e) => e.type === "TIME_OFF")
    .reduce((sum, e) => sum + e.hours, 0);
  const adjustmentHours = adjustments.reduce((sum, a) => sum + a.hours, 0);

  return {
    earnedHours,
    usedHours,
    adjustmentHours,
    balanceHours: earnedHours - usedHours + adjustmentHours,
  };
}
