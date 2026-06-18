import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { createNotification } from "@/lib/notifications";

// Norwegian AML §4-6 deadlines in calendar days from first sick day
const OPPFOLGING_PLAN_DAYS = 28;   // week 4
const DIALOG_MOTE_1_DAYS = 49;     // week 7
const DIALOG_MOTE_2_DAYS = 182;    // week 26

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function canManage(role: string) {
  return role === "ADMIN" || role === "HR" || role === "MANAGER";
}

export const sickLeaveRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  list: profileProcedure
    .input(z.object({
      status: z.enum(["ACTIVE", "CLOSED"]).optional(),
      employeeId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      let where: Record<string, unknown> = {};
      if (!isHrAdmin) {
        if (profile.role === "MANAGER" && profile.departmentId) {
          where = { employee: { departmentId: profile.departmentId } };
        } else {
          where = { employeeId: profile.id };
        }
      }
      if (input.status) where.status = input.status;
      if (input.employeeId && isHrAdmin) where.employeeId = input.employeeId;

      return db.sickLeaveCase.findMany({
        where,
        include: {
          employee: { select: { id: true, fullName: true, email: true, departmentId: true } },
          steps: { orderBy: { dueDate: "asc" } },
        },
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
      });
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const sickCase = await db.sickLeaveCase.findUnique({
        where: { id: input.id },
        include: {
          employee: { select: { id: true, fullName: true, email: true, departmentId: true } },
          steps: {
            orderBy: { dueDate: "asc" },
            include: { completedBy: { select: { id: true, fullName: true } } },
          },
        },
      });
      if (!sickCase) throw new TRPCError({ code: "NOT_FOUND" });

      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isOwn = sickCase.employeeId === profile.id;
      const isManagerOfDept =
        profile.role === "MANAGER" &&
        sickCase.employee.departmentId === profile.departmentId;

      if (!isHrAdmin && !isOwn && !isManagerOfDept) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return sickCase;
    }),

  // ── create (HR/Admin/Manager registers a sick leave case) ─────────────────
  create: profileProcedure
    .input(z.object({
      employeeId: z.string(),
      startDate: z.string().min(1),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const start = new Date(input.startDate);

      const sickCase = await db.sickLeaveCase.create({
        data: {
          employeeId: input.employeeId,
          startDate: start,
          totalDays: 0,
          status: "ACTIVE",
          notes: input.notes ?? null,
          steps: {
            create: [
              { type: "OPPFOLGING_PLAN", dueDate: addDays(start, OPPFOLGING_PLAN_DAYS) },
              { type: "DIALOG_MOTE_1",   dueDate: addDays(start, DIALOG_MOTE_1_DAYS) },
              { type: "DIALOG_MOTE_2",   dueDate: addDays(start, DIALOG_MOTE_2_DAYS) },
              { type: "NAV_NOTIFICATION",dueDate: addDays(start, DIALOG_MOTE_2_DAYS) },
            ],
          },
        },
        include: {
          steps: true,
          employee: { select: { id: true, fullName: true } },
        },
      });

      // Notify the employee
      await createNotification({
        db,
        recipientId: input.employeeId,
        type: "LEAVE_REQUEST_CREATED",
        title: "Sykefraværsoppfølging startet",
        message: "HR har registrert en sykefraværsoppfølging for deg.",
        linkUrl: `/sykefravaer/${sickCase.id}`,
      });

      return sickCase;
    }),

  // ── completeStep ──────────────────────────────────────────────────────────
  completeStep: profileProcedure
    .input(z.object({
      stepId: z.string(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const step = await db.sickLeaveFollowUpStep.findUnique({ where: { id: input.stepId } });
      if (!step) throw new TRPCError({ code: "NOT_FOUND" });
      if (step.completedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Steget er allerede fullført." });

      return db.sickLeaveFollowUpStep.update({
        where: { id: input.stepId },
        data: {
          completedAt: new Date(),
          completedById: profile.id,
          notes: input.notes ?? step.notes,
        },
      });
    }),

  // ── updateDays (keep totalDays in sync) ───────────────────────────────────
  updateDays: profileProcedure
    .input(z.object({ id: z.string(), totalDays: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.sickLeaveCase.update({
        where: { id: input.id },
        data: { totalDays: input.totalDays },
      });
    }),

  // ── close ─────────────────────────────────────────────────────────────────
  close: profileProcedure
    .input(z.object({ id: z.string(), returnDate: z.string().optional(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (!canManage(profile.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.sickLeaveCase.update({
        where: { id: input.id },
        data: {
          status: "CLOSED",
          returnDate: input.returnDate ? new Date(input.returnDate) : undefined,
          notes: input.notes,
        },
      });
    }),
});
