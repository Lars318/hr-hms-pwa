import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const locationRouter = router({
  list: profileProcedure.query(async ({ ctx }) => {
    const { db, profile } = ctx;
    const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

    if (isHrAdmin) {
      return db.location.findMany({
        orderBy: { name: "asc" },
        include: {
          safetyRepresentative: { select: { id: true, fullName: true, email: true } },
          hseManager: { select: { id: true, fullName: true, email: true } },
          _count: { select: { incidents: true, profileAssignments: true } },
        },
      });
    }

    // MANAGER/EMPLOYEE: see only their assigned locations
    const assignments = await db.profileAssignment.findMany({
      where: { profileId: profile.id, endDate: null },
      select: { locationId: true },
    });
    const locationIds = Array.from(new Set(assignments.map((a) => a.locationId)));

    return db.location.findMany({
      where: { id: { in: locationIds } },
      orderBy: { name: "asc" },
      include: {
        safetyRepresentative: { select: { id: true, fullName: true, email: true } },
        hseManager: { select: { id: true, fullName: true, email: true } },
        _count: { select: { incidents: true, profileAssignments: true } },
      },
    });
  }),

  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const location = await db.location.findUnique({
        where: { id: input.id },
        include: {
          safetyRepresentative: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          hseManager: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          profileAssignments: {
            where: { endDate: null },
            include: {
              profile: { select: { id: true, fullName: true, title: true, avatarUrl: true, role: true, email: true } },
              department: { select: { id: true, name: true } },
            },
            orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
          },
          incidents: {
            where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
            select: { id: true, title: true, severity: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: { select: { incidents: true, riskAssessments: true, actions: true } },
        },
      });
      if (!location) throw new TRPCError({ code: "NOT_FOUND" });
      return location;
    }),

  create: hrProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        organizationName: z.string().optional(),
        staffed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.location.create({ data: input });
    }),

  update: hrProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        organizationName: z.string().optional(),
        staffed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.location.update({ where: { id }, data });
    }),

  setSafetyRepresentative: hrProcedure
    .input(z.object({ locationId: z.string(), profileId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.location.update({
        where: { id: input.locationId },
        data: { safetyRepresentativeId: input.profileId },
      });
    }),

  setHseManager: hrProcedure
    .input(z.object({ locationId: z.string(), profileId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.location.update({
        where: { id: input.locationId },
        data: { hseManagerId: input.profileId },
      });
    }),
});
