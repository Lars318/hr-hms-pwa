import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import type { Prisma } from "@prisma/client";

const actionStatuses = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
const actionPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const actionInclude = {
  assignedTo: { select: { id: true, fullName: true, email: true } },
  department: { select: { id: true, name: true } },
  riskItem: { select: { id: true, hazard: true, assessmentId: true } },
} satisfies Prisma.ActionInclude;

export const actionRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        status: z.enum(actionStatuses).optional(),
        priority: z.enum(actionPriorities).optional(),
        assignedToId: z.string().optional(),
        departmentId: z.string().optional(),
        overdueOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      // EMPLOYEE sees only actions assigned to themselves
      // MANAGER sees actions in their department + assigned to them
      // HR/ADMIN see all
      let visibilityWhere: Prisma.ActionWhereInput = {};
      if (!isHrAdmin) {
        if (profile.role === "MANAGER" && profile.departmentId) {
          visibilityWhere = {
            OR: [
              { departmentId: profile.departmentId },
              { assignedToId: profile.id },
            ],
          };
        } else {
          visibilityWhere = { assignedToId: profile.id };
        }
      }

      return db.action.findMany({
        where: {
          ...visibilityWhere,
          ...(input.status ? { status: input.status } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.assignedToId && isHrAdmin ? { assignedToId: input.assignedToId } : {}),
          ...(input.departmentId && isHrAdmin ? { departmentId: input.departmentId } : {}),
          ...(input.overdueOnly
            ? { dueDate: { lt: new Date() }, status: { notIn: ["DONE", "CANCELLED"] } }
            : {}),
        },
        include: actionInclude,
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      });
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const action = await db.action.findUnique({
        where: { id: input.id },
        include: actionInclude,
      });
      if (!action) throw new TRPCError({ code: "NOT_FOUND" });

      // Access check
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isAssigned = action.assignedToId === profile.id;
      const isInDept = action.departmentId === profile.departmentId;
      if (!isHrAdmin && !isAssigned && !(profile.role === "MANAGER" && isInDept)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return action;
    }),

  // ── update ────────────────────────────────────────────────────────────────
  update: profileProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional().nullable(),
        assignedToId: z.string().optional().nullable(),
        priority: z.enum(actionPriorities).optional(),
        dueDate: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const existing = await db.action.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isManager = profile.role === "MANAGER" && existing.departmentId === profile.departmentId;
      if (!isHrAdmin && !isManager) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await db.action.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
        },
        include: actionInclude,
      });

      await db.auditLog.create({
        data: {
          entityType: "Action",
          entityId: input.id,
          action: "ACTION_UPDATED",
          actorId: profile.id,
          metadata: { changes: input },
        },
      });

      return updated;
    }),

  // ── changeStatus ──────────────────────────────────────────────────────────
  changeStatus: profileProcedure
    .input(z.object({ id: z.string(), status: z.enum(actionStatuses) }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const existing = await db.action.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isAssigned = existing.assignedToId === profile.id;
      const isManager = profile.role === "MANAGER" && existing.departmentId === profile.departmentId;
      if (!isHrAdmin && !isAssigned && !isManager) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await db.action.update({
        where: { id: input.id },
        data: {
          status: input.status,
          completedAt: input.status === "DONE" ? new Date() : null,
        },
        include: actionInclude,
      });

      const auditAction = input.status === "DONE" ? "ACTION_COMPLETED" : "ACTION_STATUS_CHANGED";
      await db.auditLog.create({
        data: {
          entityType: "Action",
          entityId: input.id,
          action: auditAction,
          actorId: profile.id,
          metadata: { from: existing.status, to: input.status },
        },
      });

      return updated;
    }),
});
