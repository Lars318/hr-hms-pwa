import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { createNotification, createNotificationsForRoles, createNotificationsForDepartment, createNotificationsForLocation } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

// Bruk include-shape for konsistent return overalt
const incidentInclude = {
  reportedBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.IncidentInclude;

export const incidentRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  // RBAC:
  //   EMPLOYEE  → kun egne rapporterte avvik
  //   MANAGER   → avvik i egen avdeling
  //   HR/ADMIN  → alle avvik
  list: profileProcedure
    .input(
      z.object({
        search: z.string().optional(),
        severity: z.enum(severities).optional(),
        status: z.enum(statuses).optional(),
        departmentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const { search, severity, status, departmentId } = input;

      // Bygg synlighetsfilter basert på rolle
      let visibilityWhere: Prisma.IncidentWhereInput = {};
      if (profile.role === "EMPLOYEE") {
        visibilityWhere = { reportedById: profile.id };
      } else if (profile.role === "MANAGER") {
        if (!profile.departmentId) {
          return [];
        }
        visibilityWhere = { departmentId: profile.departmentId };
      }
      // HR og ADMIN: ingen ekstra filter

      return db.incident.findMany({
        where: {
          ...visibilityWhere,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(severity ? { severity } : {}),
          ...(status ? { status } : {}),
          ...(departmentId ? { departmentId } : {}),
        },
        include: incidentInclude,
        orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      });
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const incident = await db.incident.findUnique({
        where: { id: input.id },
        include: {
          ...incidentInclude,
          auditLogs: {
            include: { actor: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Avvik ikke funnet." });

      // Tilgangskontroll
      const canView =
        profile.role === "ADMIN" ||
        profile.role === "HR" ||
        incident.reportedById === profile.id ||
        (profile.role === "MANAGER" && incident.departmentId === profile.departmentId);

      if (!canView) throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette avviket." });

      return incident;
    }),

  // ── create ────────────────────────────────────────────────────────────────
  // Alle innloggede brukere kan opprette avvik
  create: profileProcedure
    .input(
      z.object({
        title: z.string().min(3, "Tittel må ha minst 3 tegn").max(200),
        description: z.string().min(10, "Beskrivelse må ha minst 10 tegn").max(5000),
        severity: z.enum(severities),
        occurredAt: z.string().datetime({ offset: true }),
        dueDate: z.string().datetime({ offset: true }).optional(),
        departmentId: z.string().optional(),
        locationId: z.string().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      // EMPLOYEE og MANAGER kan kun tildele seg selv eller la stå tomt
      if (
        profile.role === "EMPLOYEE" &&
        input.assignedToId &&
        input.assignedToId !== profile.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ansatte kan ikke tildele avvik til andre." });
      }

      // Finn lokasjon: input → primær assignment → profile.departmentId sin lokasjon
      let resolvedLocationId = input.locationId;
      if (!resolvedLocationId) {
        const primary = await db.profileAssignment.findFirst({
          where: { profileId: profile.id, isPrimary: true, endDate: null },
          select: { locationId: true },
        });
        resolvedLocationId = primary?.locationId;
      }

      const incident = await db.incident.create({
        data: {
          title: input.title,
          description: input.description,
          severity: input.severity,
          occurredAt: new Date(input.occurredAt),
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          departmentId: input.departmentId ?? profile.departmentId ?? undefined,
          locationId: resolvedLocationId ?? undefined,
          assignedToId: input.assignedToId ?? undefined,
          reportedById: profile.id,
        },
        include: incidentInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "Incident",
          entityId: incident.id,
          incidentId: incident.id,
          action: "CREATE",
          actorId: profile.id,
          metadata: { severity: incident.severity, status: incident.status },
        },
      });

      // Varsle HR/ADMIN
      await createNotificationsForRoles({
        db,
        roles: ["ADMIN", "HR"],
        type: "INCIDENT_CREATED",
        title: "Nytt avvik rapportert",
        message: `${profile.fullName} rapporterte: "${incident.title}" (${incident.severity})`,
        linkUrl: `/avvik/${incident.id}`,
        excludeProfileId: profile.id,
      });
      // Varsle verneombud og HMS-ansvarlig for lokasjonen
      if (incident.locationId) {
        await createNotificationsForLocation({
          db,
          locationId: incident.locationId,
          type: "INCIDENT_CREATED",
          title: "Nytt avvik på din lokasjon",
          message: `${profile.fullName} rapporterte: "${incident.title}"`,
          linkUrl: `/avvik/${incident.id}`,
          excludeProfileId: profile.id,
        });
      }
      // Varsle leder i avdelingen
      if (incident.departmentId) {
        await createNotificationsForDepartment({
          db,
          departmentId: incident.departmentId,
          roles: ["MANAGER"],
          type: "INCIDENT_CREATED",
          title: "Nytt avvik i din avdeling",
          message: `${profile.fullName} rapporterte: "${incident.title}"`,
          linkUrl: `/avvik/${incident.id}`,
          excludeProfileId: profile.id,
        });
      }
      // Varsle tildelt bruker
      if (incident.assignedToId && incident.assignedToId !== profile.id) {
        await createNotification({
          db,
          recipientId: incident.assignedToId,
          type: "INCIDENT_ASSIGNED",
          title: "Du ble tildelt et avvik",
          message: `"${incident.title}" er tildelt deg`,
          linkUrl: `/avvik/${incident.id}`,
        });
      }

      return incident;
    }),

  // ── update ────────────────────────────────────────────────────────────────
  // HR/ADMIN: kan redigere alt
  // MANAGER: kan redigere avvik i sin avdeling
  // EMPLOYEE: kan kun redigere egne OPEN avvik
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(5000).optional(),
        severity: z.enum(severities).optional(),
        occurredAt: z.string().datetime({ offset: true }).optional(),
        dueDate: z.string().datetime({ offset: true }).nullable().optional(),
        departmentId: z.string().nullable().optional(),
        assignedToId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const { id, occurredAt, dueDate, ...rest } = input;

      const incident = await db.incident.findUnique({ where: { id } });
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Avvik ikke funnet." });

      const canEdit =
        profile.role === "ADMIN" ||
        profile.role === "HR" ||
        (profile.role === "MANAGER" && incident.departmentId === profile.departmentId) ||
        (incident.reportedById === profile.id && incident.status === "OPEN");

      if (!canEdit) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du har ikke tilgang til å redigere dette avviket." });
      }

      // EMPLOYEE kan ikke endre assignedToId til andre
      if (profile.role === "EMPLOYEE" && rest.assignedToId && rest.assignedToId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ansatte kan ikke tildele avvik til andre." });
      }

      const updated = await db.incident.update({
        where: { id },
        data: {
          ...rest,
          ...(occurredAt ? { occurredAt: new Date(occurredAt) } : {}),
          ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        },
        include: incidentInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "Incident",
          entityId: id,
          incidentId: id,
          action: "UPDATE",
          actorId: profile.id,
          metadata: { updatedFields: Object.keys(rest) },
        },
      });

      // Varsle ny ansvarlig hvis assignedToId endret
      if (
        rest.assignedToId &&
        rest.assignedToId !== incident.assignedToId &&
        rest.assignedToId !== profile.id
      ) {
        await createNotification({
          db,
          recipientId: rest.assignedToId,
          type: "INCIDENT_ASSIGNED",
          title: "Du ble tildelt et avvik",
          message: `"${updated.title}" er tildelt deg`,
          linkUrl: `/avvik/${id}`,
        });
      }

      return updated;
    }),

  // ── changeStatus ──────────────────────────────────────────────────────────
  // EMPLOYEE: ingen tilgang
  // MANAGER: kan endre status på avvik i sin avdeling
  // HR/ADMIN: kan endre alle
  changeStatus: profileProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(statuses),
        comment: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      if (profile.role === "EMPLOYEE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ansatte kan ikke endre status på avvik." });
      }

      const incident = await db.incident.findUnique({ where: { id: input.id } });
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Avvik ikke funnet." });

      if (
        profile.role === "MANAGER" &&
        incident.departmentId !== profile.departmentId
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette avviket." });
      }

      const resolvedAt =
        input.status === "RESOLVED" && incident.status !== "RESOLVED"
          ? new Date()
          : input.status !== "RESOLVED"
          ? null
          : incident.resolvedAt;

      const updated = await db.incident.update({
        where: { id: input.id },
        data: {
          status: input.status,
          resolvedAt,
        },
        include: incidentInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "Incident",
          entityId: input.id,
          incidentId: input.id,
          action: "STATUS_CHANGE",
          actorId: profile.id,
          metadata: {
            from: incident.status,
            to: input.status,
            ...(input.comment ? { comment: input.comment } : {}),
          },
        },
      });

      const statusLabel: Record<string, string> = {
        OPEN: "Åpent", IN_PROGRESS: "Under arbeid", RESOLVED: "Løst", CLOSED: "Lukket",
      };
      const msg = `Status på "${updated.title}" endret til ${statusLabel[input.status] ?? input.status}`;

      // Varsle reporter
      if (incident.reportedById !== profile.id) {
        await createNotification({
          db,
          recipientId: incident.reportedById,
          type: "INCIDENT_STATUS_CHANGED",
          title: "Avvik oppdatert",
          message: msg,
          linkUrl: `/avvik/${input.id}`,
        });
      }
      // Varsle ansvarlig hvis ulik reporter
      if (
        incident.assignedToId &&
        incident.assignedToId !== incident.reportedById &&
        incident.assignedToId !== profile.id
      ) {
        await createNotification({
          db,
          recipientId: incident.assignedToId,
          type: "INCIDENT_STATUS_CHANGED",
          title: "Avvik du er ansvarlig for ble oppdatert",
          message: msg,
          linkUrl: `/avvik/${input.id}`,
        });
      }

      return updated;
    }),
});
