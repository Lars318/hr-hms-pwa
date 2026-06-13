import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { calcRiskScore, calcRiskLevel } from "@/lib/risk";
import { createNotification } from "@/lib/notifications";

const riskItemStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
const actionPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function canManageAssessment(role: string, deptId: string | null, profileDeptId: string | null) {
  if (role === "ADMIN" || role === "HR") return true;
  if (role === "MANAGER") return !!deptId && deptId === profileDeptId;
  return false;
}

export const riskItemRouter = router({
  // ── create ────────────────────────────────────────────────────────────────
  create: profileProcedure
    .input(
      z.object({
        assessmentId: z.string(),
        hazard: z.string().min(1).max(500),
        consequence: z.string().min(1).max(500),
        likelihood: z.number().int().min(1).max(5),
        impact: z.number().int().min(1).max(5),
        existingMeasures: z.string().max(1000).optional(),
        proposedMeasures: z.string().max(1000).optional(),
        responsibleId: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const assessment = await db.riskAssessment.findUnique({ where: { id: input.assessmentId } });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND", message: "Risikovurdering ikke funnet." });
      if (!canManageAssessment(profile.role, assessment.departmentId, profile.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const riskScore = calcRiskScore(input.likelihood, input.impact);
      const riskLevel = calcRiskLevel(riskScore);

      const item = await db.riskItem.create({
        data: {
          assessmentId: input.assessmentId,
          hazard: input.hazard,
          consequence: input.consequence,
          likelihood: input.likelihood,
          impact: input.impact,
          riskScore,
          riskLevel,
          existingMeasures: input.existingMeasures,
          proposedMeasures: input.proposedMeasures,
          responsibleId: input.responsibleId ?? null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          status: "OPEN",
        },
        include: {
          responsible: { select: { id: true, fullName: true } },
        },
      });

      await db.auditLog.create({
        data: {
          entityType: "RiskItem",
          entityId: item.id,
          action: "RISK_ITEM_CREATED",
          actorId: profile.id,
          metadata: { assessmentId: input.assessmentId, hazard: item.hazard, riskLevel, riskScore },
        },
      });

      return item;
    }),

  // ── update ────────────────────────────────────────────────────────────────
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        hazard: z.string().min(1).max(500).optional(),
        consequence: z.string().min(1).max(500).optional(),
        likelihood: z.number().int().min(1).max(5).optional(),
        impact: z.number().int().min(1).max(5).optional(),
        existingMeasures: z.string().max(1000).optional().nullable(),
        proposedMeasures: z.string().max(1000).optional().nullable(),
        responsibleId: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(riskItemStatuses).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const existing = await db.riskItem.findUnique({
        where: { id: input.id },
        include: { assessment: { select: { departmentId: true } } },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canManageAssessment(profile.role, existing.assessment.departmentId, profile.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Recalculate score if likelihood/impact changed
      const newLikelihood = input.likelihood ?? existing.likelihood;
      const newImpact = input.impact ?? existing.impact;
      const riskScore = calcRiskScore(newLikelihood, newImpact);
      const riskLevel = calcRiskLevel(riskScore);

      const updated = await db.riskItem.update({
        where: { id: input.id },
        data: {
          ...(input.hazard !== undefined ? { hazard: input.hazard } : {}),
          ...(input.consequence !== undefined ? { consequence: input.consequence } : {}),
          likelihood: newLikelihood,
          impact: newImpact,
          riskScore,
          riskLevel,
          ...(input.existingMeasures !== undefined ? { existingMeasures: input.existingMeasures } : {}),
          ...(input.proposedMeasures !== undefined ? { proposedMeasures: input.proposedMeasures } : {}),
          ...(input.responsibleId !== undefined ? { responsibleId: input.responsibleId } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include: { responsible: { select: { id: true, fullName: true } } },
      });

      await db.auditLog.create({
        data: {
          entityType: "RiskItem",
          entityId: input.id,
          action: "RISK_ITEM_UPDATED",
          actorId: profile.id,
          metadata: { riskLevel, riskScore, status: updated.status },
        },
      });

      return updated;
    }),

  // ── delete ────────────────────────────────────────────────────────────────
  delete: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const existing = await db.riskItem.findUnique({
        where: { id: input.id },
        include: { assessment: { select: { departmentId: true } } },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canManageAssessment(profile.role, existing.assessment.departmentId, profile.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.riskItem.delete({ where: { id: input.id } });
      await db.auditLog.create({
        data: {
          entityType: "RiskItem",
          entityId: input.id,
          action: "RISK_ITEM_DELETED",
          actorId: profile.id,
          metadata: { assessmentId: existing.assessmentId },
        },
      });
      return { deleted: true };
    }),

  // ── createAction ──────────────────────────────────────────────────────────
  createAction: profileProcedure
    .input(
      z.object({
        riskItemId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        assignedToId: z.string().optional(),
        priority: z.enum(actionPriorities).default("MEDIUM"),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const riskItem = await db.riskItem.findUnique({
        where: { id: input.riskItemId },
        include: { assessment: { select: { departmentId: true } } },
      });
      if (!riskItem) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canManageAssessment(profile.role, riskItem.assessment.departmentId, profile.departmentId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const action = await db.action.create({
        data: {
          title: input.title,
          description: input.description,
          sourceType: "RISK_ITEM",
          sourceId: input.riskItemId,
          riskItemId: input.riskItemId,
          departmentId: riskItem.assessment.departmentId,
          assignedToId: input.assignedToId ?? null,
          priority: input.priority,
          status: "OPEN",
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          assignedTo: { select: { id: true, fullName: true } },
        },
      });

      await db.auditLog.create({
        data: {
          entityType: "Action",
          entityId: action.id,
          action: "ACTION_CREATED",
          actorId: profile.id,
          metadata: { riskItemId: input.riskItemId, priority: input.priority },
        },
      });

      // Varsle ansvarlig for tiltaket
      if (action.assignedToId && action.assignedToId !== profile.id) {
        await createNotification({
          db,
          recipientId: action.assignedToId,
          type: "ACTION_ASSIGNED",
          title: "Du ble tildelt et tiltak",
          message: `"${action.title}" er tildelt deg (prioritet: ${action.priority})`,
          linkUrl: `/tiltak/${action.id}`,
        });
      }

      return action;
    }),
});
