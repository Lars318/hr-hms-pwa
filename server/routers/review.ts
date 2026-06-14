import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { createNotification } from "@/lib/notifications";

// ─── RBAC helper ──────────────────────────────────────────────────────────────

function canViewReview(
  role: string,
  profileId: string,
  review: { employeeId: string; managerId: string }
) {
  if (role === "ADMIN" || role === "HR") return true;
  return review.employeeId === profileId || review.managerId === profileId;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const reviewRouter = router({
  list: profileProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      const id = ctx.profile.id;

      const where =
        role === "ADMIN" || role === "HR"
          ? {
              status: input?.status,
              employeeId: input?.employeeId,
            }
          : role === "MANAGER"
          ? {
              managerId: id,
              status: input?.status,
            }
          : {
              employeeId: id,
              status: input?.status,
            };

      return db.employeeReview.findMany({
        where,
        include: {
          employee: { select: { id: true, fullName: true, title: true } },
          manager: { select: { id: true, fullName: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    }),

  byId: profileProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const review = await db.employeeReview.findUnique({
        where: { id: input },
        include: {
          employee: { select: { id: true, fullName: true, title: true, email: true } },
          manager: { select: { id: true, fullName: true } },
          createdBy: { select: { fullName: true } },
        },
      });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canViewReview(ctx.profile.role, ctx.profile.id, review)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // EMPLOYEE does not see managerNotes
      if (ctx.profile.role === "EMPLOYEE") {
        return { ...review, managerNotes: null };
      }
      return review;
    }),

  create: hrProcedure
    .input(z.object({
      employeeId: z.string(),
      managerId: z.string(),
      scheduledAt: z.string(),
      location: z.string().optional(),
      agenda: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const review = await db.employeeReview.create({
        data: {
          employeeId: input.employeeId,
          managerId: input.managerId,
          scheduledAt: new Date(input.scheduledAt),
          location: input.location,
          agenda: input.agenda,
          createdById: ctx.profile.id,
        },
        include: {
          employee: { select: { fullName: true } },
          manager: { select: { fullName: true } },
        },
      });

      // Notify employee and manager
      await createNotification({
        db,
        recipientId: input.employeeId,
        type: "REVIEW_SCHEDULED",
        title: "Medarbeidersamtale planlagt",
        message: `En medarbeidersamtale er planlagt med ${review.manager.fullName}.`,
        linkUrl: `/medarbeidersamtaler/${review.id}`,
      });
      if (input.managerId !== ctx.profile.id) {
        await createNotification({
          db,
          recipientId: input.managerId,
          type: "REVIEW_SCHEDULED",
          title: "Medarbeidersamtale planlagt",
          message: `Du har en medarbeidersamtale med ${review.employee.fullName}.`,
          linkUrl: `/medarbeidersamtaler/${review.id}`,
        });
      }

      return review;
    }),

  update: profileProcedure
    .input(z.object({
      id: z.string(),
      scheduledAt: z.string().optional(),
      location: z.string().optional(),
      agenda: z.string().optional(),
      managerNotes: z.string().optional(),
      sharedNotes: z.string().optional(),
      goals: z.string().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const review = await db.employeeReview.findUnique({ where: { id: input.id } });
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canViewReview(ctx.profile.role, ctx.profile.id, review)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const role = ctx.profile.role;
      const isEmployee = role === "EMPLOYEE";
      const isManager = role === "MANAGER" && review.managerId === ctx.profile.id;
      const isHrAdmin = role === "HR" || role === "ADMIN";

      // Employees can only update sharedNotes
      const data: Record<string, unknown> = {};
      if (input.sharedNotes !== undefined) data.sharedNotes = input.sharedNotes;
      if (!isEmployee) {
        if (input.scheduledAt !== undefined) data.scheduledAt = new Date(input.scheduledAt);
        if (input.location !== undefined) data.location = input.location;
        if (input.agenda !== undefined) data.agenda = input.agenda;
        if (input.goals !== undefined) data.goals = input.goals;
      }
      if (isManager || isHrAdmin) {
        if (input.managerNotes !== undefined) data.managerNotes = input.managerNotes;
      }
      if (isHrAdmin || isManager) {
        if (input.status !== undefined) {
          data.status = input.status;
          if (input.status === "COMPLETED") data.completedAt = new Date();
        }
      }

      const updated = await db.employeeReview.update({
        where: { id: input.id },
        data,
        include: { employee: { select: { id: true } } },
      });

      if (input.status === "COMPLETED") {
        await createNotification({
          db,
          recipientId: updated.employee.id,
          type: "REVIEW_COMPLETED",
          title: "Medarbeidersamtale fullført",
          message: "Referatet fra medarbeidersamtalen er tilgjengelig.",
          linkUrl: `/medarbeidersamtaler/${updated.id}`,
        });
      }

      return updated;
    }),

  upcomingCount: hrProcedure
    .query(async () => {
      return db.employeeReview.count({
        where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      });
    }),
});
