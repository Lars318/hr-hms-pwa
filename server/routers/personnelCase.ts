import { z } from "zod";
import { router, hrProcedure, profileProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { createNotification } from "@/lib/notifications";

const CASE_TYPES = ["WARNING", "PERFORMANCE_PLAN", "TERMINATION_NOTICE", "SUSPENSION", "OTHER"] as const;
const CASE_STATUSES = ["OPEN", "CLOSED", "ARCHIVED"] as const;

export const personnelCaseRouter = router({
  // HR/ADMIN: full list. MANAGER: only their assigned cases.
  list: profileProcedure
    .input(z.object({
      status: z.enum(CASE_STATUSES).optional(),
      type: z.enum(CASE_TYPES).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      if (role === "EMPLOYEE") throw new TRPCError({ code: "FORBIDDEN" });

      const where =
        role === "ADMIN" || role === "HR"
          ? { status: input?.status, type: input?.type }
          : { responsibleManagerId: ctx.profile.id, status: input?.status };

      return db.personnelCase.findMany({
        where,
        include: {
          employee: { select: { id: true, fullName: true, title: true } },
          responsibleManager: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  byId: profileProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      if (role === "EMPLOYEE") throw new TRPCError({ code: "FORBIDDEN" });

      const c = await db.personnelCase.findUnique({
        where: { id: input },
        include: {
          employee: { select: { id: true, fullName: true, title: true, email: true } },
          responsibleManager: { select: { fullName: true } },
          createdBy: { select: { fullName: true } },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { fullName: true } } },
          },
        },
      });
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });

      const isHrAdmin = role === "ADMIN" || role === "HR";
      const isManager = role === "MANAGER" && c.responsibleManagerId === ctx.profile.id;
      if (!isHrAdmin && !isManager) throw new TRPCError({ code: "FORBIDDEN" });

      // Manager cannot see internalNote
      if (isManager && !isHrAdmin) {
        return { ...c, internalNote: null };
      }
      return c;
    }),

  create: hrProcedure
    .input(z.object({
      employeeId: z.string(),
      type: z.enum(CASE_TYPES),
      summary: z.string().min(1),
      internalNote: z.string().optional(),
      responsibleManagerId: z.string().optional(),
      issuedAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const c = await db.personnelCase.create({
        data: {
          employeeId: input.employeeId,
          type: input.type,
          summary: input.summary,
          internalNote: input.internalNote,
          responsibleManagerId: input.responsibleManagerId,
          issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
          createdById: ctx.profile.id,
        },
        include: { employee: { select: { fullName: true } } },
      });

      await db.personnelCaseAuditLog.create({
        data: {
          caseId: c.id,
          actorId: ctx.profile.id,
          action: "CREATED",
          metadata: { type: input.type },
        },
      });

      // Notify employee — no sensitive details, just that a case was opened
      await createNotification({
        db,
        recipientId: input.employeeId,
        type: "PERSONNEL_CASE_OPENED",
        title: "Personalsak opprettet",
        message: "HR har opprettet en personalsak. Ta kontakt med HR for informasjon.",
        linkUrl: undefined,
      });

      return c;
    }),

  update: hrProcedure
    .input(z.object({
      id: z.string(),
      summary: z.string().optional(),
      internalNote: z.string().optional(),
      outcomeNote: z.string().optional(),
      responsibleManagerId: z.string().nullable().optional(),
      status: z.enum(CASE_STATUSES).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, ...rest } = input;

      const existing = await db.personnelCase.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const closedAt = status === "CLOSED" && existing.status !== "CLOSED" ? new Date() : undefined;

      const updated = await db.personnelCase.update({
        where: { id },
        data: {
          ...rest,
          ...(status !== undefined ? { status } : {}),
          ...(closedAt ? { closedAt } : {}),
        },
        include: { employee: { select: { id: true } } },
      });

      await db.personnelCaseAuditLog.create({
        data: {
          caseId: id,
          actorId: ctx.profile.id,
          action: status ? `STATUS_CHANGED_TO_${status}` : "UPDATED",
        },
      });

      if (status === "CLOSED" && existing.status !== "CLOSED") {
        await createNotification({
          db,
          recipientId: updated.employee.id,
          type: "PERSONNEL_CASE_CLOSED",
          title: "Personalsak avsluttet",
          message: "En personalsak som gjaldt deg er avsluttet. Ta kontakt med HR ved spørsmål.",
          linkUrl: undefined,
        });
      }

      return updated;
    }),

  acknowledge: hrProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const updated = await db.personnelCase.update({
        where: { id: input },
        data: { isAcknowledged: true, acknowledgedAt: new Date() },
      });
      await db.personnelCaseAuditLog.create({
        data: { caseId: input, actorId: ctx.profile.id, action: "ACKNOWLEDGED" },
      });
      return updated;
    }),

  openCount: hrProcedure
    .query(async () => db.personnelCase.count({ where: { status: "OPEN" } })),
});
