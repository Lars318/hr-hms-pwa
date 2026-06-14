import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import type { Prisma } from "@prisma/client";

const chemicalInclude = {
  location: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ChemicalInclude;

export const chemicalRouter = router({
  list: profileProcedure
    .input(
      z.object({
        locationId: z.string().optional(),
        departmentId: z.string().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
        reviewDueSoon: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const where: Prisma.ChemicalWhereInput = {
        status: input?.status ?? "ACTIVE",
        ...(input?.locationId ? { locationId: input.locationId } : {}),
        ...(input?.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input?.reviewDueSoon
          ? {
              OR: [
                { reviewDate: { gt: now, lte: soonThreshold } },
                { expiresAt: { gt: now, lte: soonThreshold } },
              ],
            }
          : {}),
      };

      return ctx.db.chemical.findMany({
        where,
        include: chemicalInclude,
        orderBy: { name: "asc" },
      });
    }),

  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const chemical = await ctx.db.chemical.findUnique({
        where: { id: input.id },
        include: {
          ...chemicalInclude,
          auditLogs: {
            include: { actor: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
      if (!chemical) throw new TRPCError({ code: "NOT_FOUND" });
      return chemical;
    }),

  create: hrProcedure
    .input(
      z.object({
        name: z.string().min(1),
        supplier: z.string().optional(),
        description: z.string().optional(),
        hazardSymbols: z.array(z.string()).default([]),
        protectiveEquipment: z.string().optional(),
        riskNote: z.string().optional(),
        storageInstructions: z.string().optional(),
        sdsReference: z.string().optional(),
        reviewDate: z.string().datetime().optional(),
        expiresAt: z.string().datetime().optional(),
        locationId: z.string().optional(),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chemical = await ctx.db.chemical.create({
        data: {
          name: input.name,
          supplier: input.supplier,
          description: input.description,
          hazardSymbols: input.hazardSymbols,
          protectiveEquipment: input.protectiveEquipment,
          riskNote: input.riskNote,
          storageInstructions: input.storageInstructions,
          sdsReference: input.sdsReference,
          reviewDate: input.reviewDate ? new Date(input.reviewDate) : null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          locationId: input.locationId,
          departmentId: input.departmentId,
          createdById: ctx.profile.id,
        },
        include: chemicalInclude,
      });

      await ctx.db.chemicalAuditLog.create({
        data: { chemicalId: chemical.id, actorId: ctx.profile.id, action: "CREATED" },
      });

      return chemical;
    }),

  update: hrProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        supplier: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        hazardSymbols: z.array(z.string()).optional(),
        protectiveEquipment: z.string().nullable().optional(),
        riskNote: z.string().nullable().optional(),
        storageInstructions: z.string().nullable().optional(),
        sdsReference: z.string().nullable().optional(),
        reviewDate: z.string().datetime().nullable().optional(),
        expiresAt: z.string().datetime().nullable().optional(),
        locationId: z.string().nullable().optional(),
        departmentId: z.string().nullable().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reviewDate, expiresAt, ...rest } = input;

      const chemical = await ctx.db.chemical.update({
        where: { id },
        data: {
          ...rest,
          ...(reviewDate !== undefined ? { reviewDate: reviewDate ? new Date(reviewDate) : null } : {}),
          ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        },
        include: chemicalInclude,
      });

      await ctx.db.chemicalAuditLog.create({
        data: { chemicalId: id, actorId: ctx.profile.id, action: "UPDATED" },
      });

      return chemical;
    }),

  archive: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const chemical = await ctx.db.chemical.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });

      await ctx.db.chemicalAuditLog.create({
        data: { chemicalId: input.id, actorId: ctx.profile.id, action: "ARCHIVED" },
      });

      return chemical;
    }),

  // Antall som utløper/er til revisjon — dashboardkort
  reviewDueCount: profileProcedure
    .query(async ({ ctx }) => {
      const { role } = ctx.profile;
      if (role === "EMPLOYEE") return null;

      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const count = await ctx.db.chemical.count({
        where: {
          status: "ACTIVE",
          OR: [
            { reviewDate: { lte: soonThreshold } },
            { expiresAt: { lte: soonThreshold } },
          ],
        },
      });
      return count;
    }),
});
