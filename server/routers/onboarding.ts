import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";

// ─── Templates ────────────────────────────────────────────────────────────────

const templateTaskInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().default(0),
  isRequired: z.boolean().default(true),
  daysOffset: z.number().int().optional(),
});

export const onboardingRouter = router({
  // ── Templates (HR/ADMIN) ────────────────────────────────────────────────────

  listTemplates: hrProcedure
    .input(z.object({ type: z.enum(["ONBOARDING", "OFFBOARDING"]).optional() }).optional())
    .query(async ({ input }) => {
      return db.onboardingTemplate.findMany({
        where: {
          isActive: true,
          type: input?.type,
        },
        include: {
          _count: { select: { tasks: true, processes: true } },
          location: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  templateById: hrProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const t = await db.onboardingTemplate.findUnique({
        where: { id: input },
        include: {
          tasks: { orderBy: { order: "asc" } },
          location: { select: { name: true } },
        },
      });
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      return t;
    }),

  createTemplate: hrProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["ONBOARDING", "OFFBOARDING"]),
      locationId: z.string().optional(),
      tasks: z.array(templateTaskInput),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tasks, ...rest } = input;
      return db.onboardingTemplate.create({
        data: {
          ...rest,
          createdById: ctx.profile.id,
          tasks: { create: tasks },
        },
      });
    }),

  updateTemplate: hrProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      locationId: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
      tasks: z.array(templateTaskInput.extend({ id: z.string().optional() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, tasks, ...rest } = input;
      if (tasks !== undefined) {
        // Replace all tasks
        await db.onboardingTemplateTask.deleteMany({ where: { templateId: id } });
        await db.onboardingTemplateTask.createMany({
          data: tasks.map((t) => ({ ...t, templateId: id })),
        });
      }
      return db.onboardingTemplate.update({ where: { id }, data: rest });
    }),

  // ── Processes ───────────────────────────────────────────────────────────────

  listProcesses: hrProcedure
    .input(z.object({
      type: z.enum(["ONBOARDING", "OFFBOARDING"]).optional(),
      status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.onboardingProcess.findMany({
        where: {
          type: input?.type,
          status: input?.status,
        },
        include: {
          employee: { select: { id: true, fullName: true, title: true } },
          responsibleHr: { select: { fullName: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  myProcesses: profileProcedure
    .query(async ({ ctx }) => {
      return db.onboardingProcess.findMany({
        where: { employeeId: ctx.profile.id, status: "ACTIVE" },
        include: {
          tasks: { orderBy: { order: "asc" } },
          responsibleHr: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  processById: hrProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const p = await db.onboardingProcess.findUnique({
        where: { id: input },
        include: {
          employee: { select: { id: true, fullName: true, email: true, title: true } },
          responsibleHr: { select: { fullName: true } },
          template: { select: { name: true } },
          tasks: {
            orderBy: { order: "asc" },
            include: { completedBy: { select: { fullName: true } } },
          },
        },
      });
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  startProcess: hrProcedure
    .input(z.object({
      employeeId: z.string(),
      type: z.enum(["ONBOARDING", "OFFBOARDING"]),
      startDate: z.string(), // ISO date string
      templateId: z.string().optional(),
      responsibleHrId: z.string().optional(),
      notes: z.string().optional(),
      tasks: z.array(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        order: z.number().int().default(0),
        isRequired: z.boolean().default(true),
        dueDate: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tasks, startDate, ...rest } = input;

      // If templateId given, clone tasks from template
      let tasksToCreate = tasks ?? [];
      if (input.templateId && (!tasks || tasks.length === 0)) {
        const tmpl = await db.onboardingTemplate.findUnique({
          where: { id: input.templateId },
          include: { tasks: { orderBy: { order: "asc" } } },
        });
        if (tmpl) {
          const start = new Date(startDate);
          tasksToCreate = tmpl.tasks.map((t) => ({
            title: t.title,
            description: t.description ?? undefined,
            order: t.order,
            isRequired: t.isRequired,
            dueDate: t.daysOffset != null
              ? new Date(start.getTime() + t.daysOffset * 86_400_000).toISOString()
              : undefined,
          }));
        }
      }

      const process = await db.onboardingProcess.create({
        data: {
          ...rest,
          startDate: new Date(startDate),
          tasks: {
            create: tasksToCreate.map((t) => ({
              title: t.title,
              description: t.description,
              order: t.order,
              isRequired: t.isRequired,
              dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            })),
          },
        },
        include: { employee: { select: { fullName: true } } },
      });

      const typeLabel = input.type === "ONBOARDING" ? "onboarding" : "offboarding";
      const notifType = input.type === "ONBOARDING"
        ? "ONBOARDING_TASK_ASSIGNED" as const
        : "OFFBOARDING_TASK_ASSIGNED" as const;

      await createNotification({
        db,
        recipientId: input.employeeId,
        type: notifType,
        title: `${input.type === "ONBOARDING" ? "Onboarding" : "Offboarding"} startet`,
        message: `Din ${typeLabel}-prosess er startet. Se oppgavelisten din.`,
        linkUrl: "/onboarding",
      });

      void createNotificationsForRoles({
        db,
        roles: ["ADMIN", "HR"],
        type: notifType,
        title: `${input.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}: ${process.employee.fullName}`,
        message: `Ny ${typeLabel}-prosess er startet.`,
        linkUrl: `/admin/onboarding/${process.id}`,
        excludeProfileId: ctx.profile.id,
      });

      return process;
    }),

  updateProcess: hrProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
      responsibleHrId: z.string().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const completedAt = data.status === "COMPLETED" ? new Date() : undefined;
      const updated = await db.onboardingProcess.update({
        where: { id },
        data: { ...data, ...(completedAt ? { completedAt } : {}) },
        include: {
          employee: { select: { id: true, fullName: true } },
        },
      });

      if (data.status === "COMPLETED") {
        const notifType = updated.type === "ONBOARDING"
          ? "ONBOARDING_COMPLETED" as const
          : "OFFBOARDING_COMPLETED" as const;
        await createNotification({
          db,
          recipientId: updated.employee.id,
          type: notifType,
          title: `${updated.type === "ONBOARDING" ? "Onboarding" : "Offboarding"} fullført`,
          message: "Alle oppgaver er fullført. Ta kontakt med HR ved spørsmål.",
          linkUrl: "/onboarding",
        });
      }

      return updated;
    }),

  // ── Tasks ───────────────────────────────────────────────────────────────────

  updateTask: profileProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDING", "COMPLETED", "SKIPPED"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.onboardingTask.findUnique({
        where: { id: input.id },
        include: { process: { select: { employeeId: true } } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const isEmployee = ctx.profile.role === "EMPLOYEE";
      const isOwner = task.process.employeeId === ctx.profile.id;
      if (isEmployee && !isOwner) throw new TRPCError({ code: "FORBIDDEN" });

      const completedAt = input.status === "COMPLETED" ? new Date() : null;
      return db.onboardingTask.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes,
          completedAt,
          completedById: input.status === "COMPLETED" ? ctx.profile.id : null,
        },
      });
    }),

  openCount: hrProcedure
    .query(async () => {
      return db.onboardingProcess.count({ where: { status: "ACTIVE" } });
    }),
});
