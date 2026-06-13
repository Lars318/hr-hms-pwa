import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const profileAssignmentRouter = router({
  listByProfile: profileProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, profile } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isSelf = profile.id === input.profileId;
      if (!isHrAdmin && !isSelf && profile.role !== "MANAGER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.profileAssignment.findMany({
        where: { profileId: input.profileId },
        include: {
          location: { select: { id: true, name: true, city: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
      });
    }),

  listByLocation: profileProcedure
    .input(z.object({ locationId: z.string(), activeOnly: z.boolean().default(true) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.profileAssignment.findMany({
        where: {
          locationId: input.locationId,
          ...(input.activeOnly ? { endDate: null } : {}),
        },
        include: {
          profile: { select: { id: true, fullName: true, title: true, avatarUrl: true, role: true, email: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
      });
    }),

  create: hrProcedure
    .input(
      z.object({
        profileId: z.string(),
        locationId: z.string(),
        departmentId: z.string().optional(),
        roleLabel: z.string().optional(),
        isPrimary: z.boolean().default(false),
        startDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      if (input.isPrimary) {
        await db.profileAssignment.updateMany({
          where: { profileId: input.profileId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return db.profileAssignment.create({ data: input });
    }),

  update: hrProcedure
    .input(
      z.object({
        id: z.string(),
        locationId: z.string().optional(),
        departmentId: z.string().nullable().optional(),
        roleLabel: z.string().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.profileAssignment.update({ where: { id }, data });
    }),

  endAssignment: hrProcedure
    .input(z.object({ id: z.string(), endDate: z.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.profileAssignment.update({
        where: { id: input.id },
        data: { endDate: input.endDate ?? new Date() },
      });
    }),

  setPrimary: hrProcedure
    .input(z.object({ id: z.string(), profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.profileAssignment.updateMany({
        where: { profileId: input.profileId, isPrimary: true },
        data: { isPrimary: false },
      });
      return db.profileAssignment.update({
        where: { id: input.id },
        data: { isPrimary: true },
      });
    }),
});
