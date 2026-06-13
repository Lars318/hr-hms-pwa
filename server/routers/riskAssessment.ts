import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { calcRiskScore, calcRiskLevel } from "@/lib/risk";
import { createNotificationsForRoles, createNotificationsForDepartment, createNotificationsForLocation } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

const statuses = ["DRAFT", "ACTIVE", "REVIEW", "CLOSED"] as const;

const assessmentInclude = {
  owner: { select: { id: true, fullName: true } },
  department: { select: { id: true, name: true } },
  _count: { select: { riskItems: true } },
} satisfies Prisma.RiskAssessmentInclude;

function canManage(role: string, profile: { departmentId: string | null }, departmentId: string | null) {
  if (role === "ADMIN" || role === "HR") return true;
  if (role === "MANAGER") return !!departmentId && profile.departmentId === departmentId;
  return false;
}

function canView(role: string, profile: { departmentId: string | null }, departmentId: string | null) {
  if (role === "ADMIN" || role === "HR") return true;
  if (role === "MANAGER") return !!departmentId && profile.departmentId === departmentId;
  if (role === "EMPLOYEE") return !!departmentId && profile.departmentId === departmentId;
  return false;
}

export const riskAssessmentRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(statuses).optional(),
        departmentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      // Employees and managers only see their department
      const deptFilter: Prisma.RiskAssessmentWhereInput =
        isHrAdmin
          ? {}
          : profile.departmentId
          ? { departmentId: profile.departmentId }
          : { id: { in: [] } }; // no department → see nothing

      return db.riskAssessment.findMany({
        where: {
          ...deptFilter,
          ...(input.status ? { status: input.status } : {}),
          ...(input.departmentId && isHrAdmin ? { departmentId: input.departmentId } : {}),
          ...(input.search
            ? { OR: [
                { title: { contains: input.search, mode: "insensitive" } },
                { description: { contains: input.search, mode: "insensitive" } },
              ] }
            : {}),
        },
        include: assessmentInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      });
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const assessment = await db.riskAssessment.findUnique({
        where: { id: input.id },
        include: {
          ...assessmentInclude,
          riskItems: {
            include: {
              responsible: { select: { id: true, fullName: true } },
              actions: {
                include: {
                  assignedTo: { select: { id: true, fullName: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: [{ riskLevel: "desc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canView(profile.role, profile, assessment.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return assessment;
    }),

  // ── create ────────────────────────────────────────────────────────────────
  create: profileProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        departmentId: z.string().optional(),
        locationId: z.string().optional(),
        reviewDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role, profile, input.departmentId ?? null)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ikke tilgang til å opprette risikovurdering for denne avdelingen." });
      }

      // Resolve locationId from input or primary ProfileAssignment
      let resolvedLocationId = input.locationId ?? null;
      if (!resolvedLocationId) {
        const primary = await db.profileAssignment.findFirst({
          where: { profileId: profile.id, isPrimary: true, endDate: null },
          select: { locationId: true },
        });
        resolvedLocationId = primary?.locationId ?? null;
      }

      const assessment = await db.riskAssessment.create({
        data: {
          title: input.title,
          description: input.description,
          departmentId: input.departmentId ?? null,
          locationId: resolvedLocationId,
          ownerId: profile.id,
          status: "DRAFT",
          reviewDate: input.reviewDate ? new Date(input.reviewDate) : null,
        },
      });

      await db.auditLog.create({
        data: {
          entityType: "RiskAssessment",
          entityId: assessment.id,
          action: "RISK_ASSESSMENT_CREATED",
          actorId: profile.id,
          metadata: { title: assessment.title },
        },
      });

      // Varsle verneombud/HMS-ansvarlig for lokasjonen, eller HR/ADMIN som fallback
      if (assessment.locationId) {
        await createNotificationsForLocation({
          db,
          locationId: assessment.locationId,
          type: "RISK_REVIEW_DUE",
          title: "Ny risikovurdering opprettet",
          message: `"${assessment.title}" er opprettet av ${profile.fullName}`,
          linkUrl: `/risiko/${assessment.id}`,
          excludeProfileId: profile.id,
        });
      } else {
        await createNotificationsForRoles({
          db,
          roles: ["ADMIN", "HR"],
          type: "RISK_REVIEW_DUE",
          title: "Ny risikovurdering opprettet",
          message: `"${assessment.title}" er opprettet av ${profile.fullName}`,
          linkUrl: `/risiko/${assessment.id}`,
          excludeProfileId: profile.id,
        });
      }
      if (assessment.departmentId) {
        await createNotificationsForDepartment({
          db,
          departmentId: assessment.departmentId,
          roles: ["MANAGER"],
          type: "RISK_REVIEW_DUE",
          title: "Ny risikovurdering i din avdeling",
          message: `"${assessment.title}" er opprettet`,
          linkUrl: `/risiko/${assessment.id}`,
          excludeProfileId: profile.id,
        });
      }

      return assessment;
    }),

  // ── update ────────────────────────────────────────────────────────────────
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional().nullable(),
        departmentId: z.string().optional().nullable(),
        status: z.enum(statuses).optional(),
        reviewDate: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const existing = await db.riskAssessment.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canManage(profile.role, profile, existing.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await db.riskAssessment.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.reviewDate !== undefined
            ? { reviewDate: input.reviewDate ? new Date(input.reviewDate) : null }
            : {}),
        },
      });

      await db.auditLog.create({
        data: {
          entityType: "RiskAssessment",
          entityId: updated.id,
          action: "RISK_ASSESSMENT_UPDATED",
          actorId: profile.id,
          metadata: { changes: input },
        },
      });

      return updated;
    }),

  // ── deleteOrClose ──────────────────────────────────────────────────────────
  deleteOrClose: profileProcedure
    .input(z.object({ id: z.string(), action: z.enum(["close", "delete"]) }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isAdmin = profile.role === "ADMIN";

      const existing = await db.riskAssessment.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canManage(profile.role, profile, existing.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.action === "close") {
        const updated = await db.riskAssessment.update({
          where: { id: input.id },
          data: { status: "CLOSED" },
        });
        await db.auditLog.create({
          data: {
            entityType: "RiskAssessment",
            entityId: input.id,
            action: "RISK_ASSESSMENT_CLOSED",
            actorId: profile.id,
          },
        });
        return updated;
      }

      // Hard delete: admin only
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Kun ADMIN kan slette risikovurderinger." });
      await db.riskAssessment.delete({ where: { id: input.id } });
      await db.auditLog.create({
        data: {
          entityType: "RiskAssessment",
          entityId: input.id,
          action: "RISK_ASSESSMENT_DELETED",
          actorId: profile.id,
        },
      });
      return { deleted: true };
    }),
});
