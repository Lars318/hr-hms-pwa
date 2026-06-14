import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

const categories = ["HARASSMENT", "DISCRIMINATION", "SAFETY", "FINANCIAL_MISCONDUCT", "ETHICS", "RETALIATION", "OTHER"] as const;
const statuses = ["RECEIVED", "UNDER_REVIEW", "INVESTIGATING", "ACTION_REQUIRED", "CLOSED", "REJECTED"] as const;
const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const caseInclude = {
  reporter: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  location: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.WhistleblowingCaseInclude;

function canViewCase(
  role: string,
  profileId: string,
  c: { reporterId: string | null; assignedToId: string | null; category: string; isAnonymous: boolean }
) {
  if (role === "ADMIN" || role === "HR") return true;
  if (role === "MANAGER") {
    // Kun hvis eksplisitt tildelt
    return c.assignedToId === profileId;
  }
  if (role === "EMPLOYEE") {
    return !c.isAnonymous && c.reporterId === profileId;
  }
  return false;
}

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VB-${year}-${rand}`;
}

export const whistleblowingRouter = router({
  // ── create ──────────────────────────────────────────────────────────────────
  create: profileProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10),
        category: z.enum(categories),
        severity: z.enum(severities).default("MEDIUM"),
        isAnonymous: z.boolean().default(false),
        isConfidential: z.boolean().default(true),
        locationId: z.string().optional(),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const caseNumber = generateCaseNumber();

      const wbCase = await db.whistleblowingCase.create({
        data: {
          caseNumber,
          title: input.title,
          description: input.description,
          category: input.category,
          severity: input.severity,
          isAnonymous: input.isAnonymous,
          isConfidential: input.isConfidential,
          reporterId: input.isAnonymous ? null : profile.id,
          locationId: input.locationId ?? null,
          departmentId: input.departmentId ?? null,
        },
      });

      await db.whistleblowingAuditLog.create({
        data: {
          caseId: wbCase.id,
          actorId: input.isAnonymous ? null : profile.id,
          action: "CASE_CREATED",
          metadata: { caseNumber, category: input.category, severity: input.severity },
        },
      });

      // Send nøytral varsel til HR/ADMIN — IKKE med beskrivelse
      const rolesToNotify: Array<"HR" | "ADMIN"> = ["HR", "ADMIN"];
      if (input.category === "SAFETY") {
        // HMS-ansvarlig varsles via HR/ADMIN-kanalen
      }
      await createNotificationsForRoles({
        db,
        roles: rolesToNotify,
        type: "WHISTLEBLOWING_RECEIVED",
        title: "Ny varslingssak er registrert",
        message: `Saksnummer: ${caseNumber}. Gå til varslingssak-oversikten for detaljer.`,
        linkUrl: `/varsling/${wbCase.id}`,
      });

      return wbCase;
    }),

  // ── list (admin/HR) ─────────────────────────────────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        status: z.enum(statuses).optional(),
        category: z.enum(categories).optional(),
        severity: z.enum(severities).optional(),
        locationId: z.string().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      if (profile.role === "EMPLOYEE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bruk /mine for dine egne varslingssaker." });
      }

      let where: Prisma.WhistleblowingCaseWhereInput = {};

      if (profile.role === "MANAGER") {
        // Manager kan kun se saker de er tildelt
        where = { assignedToId: profile.id };
      } else if (profile.role === "HR") {
        // HR ser alle
      } else if (profile.role === "ADMIN") {
        // Admin ser alle
      }

      return db.whistleblowingCase.findMany({
        where: {
          ...where,
          ...(input.status ? { status: input.status } : {}),
          ...(input.category ? { category: input.category } : {}),
          ...(input.severity ? { severity: input.severity } : {}),
          ...(input.locationId ? { locationId: input.locationId } : {}),
          ...(input.assignedToId ? { assignedToId: input.assignedToId } : {}),
        },
        include: caseInclude,
        orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      });
    }),

  // ── mine (ansatt: egne, ikke-anonyme) ────────────────────────────────────────
  mine: profileProcedure
    .query(async ({ ctx }) => {
      const { profile, db } = ctx;
      return db.whistleblowingCase.findMany({
        where: { reporterId: profile.id, isAnonymous: false },
        include: caseInclude,
        orderBy: { createdAt: "desc" },
      });
    }),

  // ── byId ─────────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const wbCase = await db.whistleblowingCase.findUnique({
        where: { id: input.id },
        include: {
          ...caseInclude,
          messages: {
            where: profile.role === "EMPLOYEE"
              ? { isInternalNote: false }
              : {},
            include: { author: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: "asc" },
          },
          auditLogs: {
            include: { actor: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!wbCase) throw new TRPCError({ code: "NOT_FOUND" });

      if (!canViewCase(profile.role, profile.id, {
        reporterId: wbCase.reporterId,
        assignedToId: wbCase.assignedToId,
        category: wbCase.category,
        isAnonymous: wbCase.isAnonymous,
      })) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return wbCase;
    }),

  // ── addMessage ───────────────────────────────────────────────────────────────
  addMessage: profileProcedure
    .input(
      z.object({
        caseId: z.string(),
        body: z.string().min(1),
        isInternalNote: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const wbCase = await db.whistleblowingCase.findUnique({ where: { id: input.caseId } });
      if (!wbCase) throw new TRPCError({ code: "NOT_FOUND" });

      if (!canViewCase(profile.role, profile.id, {
        reporterId: wbCase.reporterId,
        assignedToId: wbCase.assignedToId,
        category: wbCase.category,
        isAnonymous: wbCase.isAnonymous,
      })) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Kun HR/ADMIN/MANAGER kan skrive interne notater
      if (input.isInternalNote && profile.role === "EMPLOYEE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ansatte kan ikke legge til interne notater." });
      }

      const msg = await db.whistleblowingMessage.create({
        data: {
          caseId: input.caseId,
          authorId: profile.id,
          body: input.body,
          isInternalNote: input.isInternalNote,
        },
      });

      await db.whistleblowingAuditLog.create({
        data: {
          caseId: input.caseId,
          actorId: profile.id,
          action: input.isInternalNote ? "INTERNAL_NOTE_ADDED" : "MESSAGE_ADDED",
        },
      });

      return msg;
    }),

  // ── updateStatus ─────────────────────────────────────────────────────────────
  updateStatus: profileProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(statuses),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      if (profile.role !== "HR" && profile.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kun HR/ADMIN kan endre status." });
      }

      const prev = await db.whistleblowingCase.findUnique({ where: { id: input.id } });
      if (!prev) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await db.whistleblowingCase.update({
        where: { id: input.id },
        data: {
          status: input.status,
          closedAt: input.status === "CLOSED" || input.status === "REJECTED" ? new Date() : undefined,
        },
      });

      await db.whistleblowingAuditLog.create({
        data: {
          caseId: input.id,
          actorId: profile.id,
          action: "STATUS_CHANGED",
          metadata: { from: prev.status, to: input.status },
        },
      });

      // Varsle reporter hvis ikke anonym
      if (prev.reporterId) {
        await createNotification({
          db,
          recipientId: prev.reporterId,
          type: "WHISTLEBLOWING_RECEIVED",
          title: "Status på varslingssak oppdatert",
          message: `Sak ${prev.caseNumber} har fått ny status.`,
          linkUrl: `/varsling/${input.id}`,
        });
      }

      return updated;
    }),

  // ── assign ───────────────────────────────────────────────────────────────────
  assign: profileProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      if (profile.role !== "HR" && profile.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kun HR/ADMIN kan tildele saksbehandler." });
      }

      const updated = await db.whistleblowingCase.update({
        where: { id: input.id },
        data: { assignedToId: input.assignedToId },
      });

      await db.whistleblowingAuditLog.create({
        data: {
          caseId: input.id,
          actorId: profile.id,
          action: "ASSIGNED",
          metadata: { assignedToId: input.assignedToId },
        },
      });

      if (input.assignedToId) {
        await createNotification({
          db,
          recipientId: input.assignedToId,
          type: "WHISTLEBLOWING_RECEIVED",
          title: "Du er tildelt en varslingssak",
          message: `Du er satt som saksbehandler for sak ${updated.caseNumber}.`,
          linkUrl: `/varsling/${input.id}`,
        });
      }

      return updated;
    }),

  // ── openCount (for dashboard) ────────────────────────────────────────────────
  openCount: profileProcedure
    .query(async ({ ctx }) => {
      const { profile, db } = ctx;

      if (profile.role === "EMPLOYEE") return null;

      if (profile.role === "MANAGER") {
        return db.whistleblowingCase.count({
          where: {
            assignedToId: profile.id,
            status: { notIn: ["CLOSED", "REJECTED"] },
          },
        });
      }

      return db.whistleblowingCase.count({
        where: { status: { notIn: ["CLOSED", "REJECTED"] } },
      });
    }),
});
