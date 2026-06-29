import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure, adminProcedure } from "@/server/trpc/trpc";

export const departmentRouter = router({
  // Alle innloggede brukere kan lese avdelinger (trengs i skjemaer)
  list: profileProcedure.query(async ({ ctx }) => {
    const departments = await ctx.db.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { employees: true } }, location: { select: { id: true, name: true } } },
    });
    return departments;
  }),

  // HR/ADMIN: ansatte i én avdeling (for oppsummering)
  employees: hrProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const department = await ctx.db.department.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });
      if (!department) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avdeling ikke funnet." });
      }
      const employees = await ctx.db.profile.findMany({
        where: { departmentId: input.id },
        select: {
          id: true,
          fullName: true,
          email: true,
          title: true,
          employeeNumber: true,
          role: true,
          status: true,
        },
        orderBy: [{ status: "asc" }, { fullName: "asc" }],
      });
      return { department, employees };
    }),

  // HR/ADMIN: opprett avdeling
  create: hrProcedure
    .input(z.object({ name: z.string().min(1, "Navn er påkrevd").max(100) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.department.findFirst({ where: { name: input.name } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Avdelingen finnes allerede." });
      }
      return ctx.db.department.create({ data: input });
    }),

  // HR/ADMIN: oppdater avdeling
  update: hrProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(100), locationId: z.string().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const exists = await ctx.db.department.findUnique({ where: { id } });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Avdeling ikke funnet." });
      return ctx.db.department.update({ where: { id }, data });
    }),

  // ADMIN: slett avdeling (kun hvis ingen ansatte tilknyttet)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dept = await ctx.db.department.findUnique({
        where: { id: input.id },
        include: { _count: { select: { employees: true } } },
      });
      if (!dept) throw new TRPCError({ code: "NOT_FOUND", message: "Avdeling ikke funnet." });
      if (dept._count.employees > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Kan ikke slette avdeling med ${dept._count.employees} ansatte. Flytt dem først.`,
        });
      }
      await ctx.db.department.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
