import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";

export const inspectionRouter = router({
  // ── Templates ─────────────────────────────────────────────────────────────
  listTemplates: profileProcedure.query(async ({ ctx }) => {
    return ctx.db.inspectionTemplate.findMany({
      where: { isActive: true },
      include: { items: { orderBy: { order: "asc" } } },
      orderBy: { title: "asc" },
    });
  }),

  createTemplate: hrProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        items: z.array(
          z.object({
            question: z.string().min(1),
            description: z.string().optional(),
            order: z.number(),
            required: z.boolean().default(true),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.inspectionTemplate.create({
        data: {
          title: input.title,
          description: input.description,
          items: { create: input.items },
        },
        include: { items: { orderBy: { order: "asc" } } },
      });
    }),

  // ── Records ────────────────────────────────────────────────────────────────
  listRecords: profileProcedure
    .input(
      z.object({
        status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      return ctx.db.inspectionRecord.findMany({
        where: {
          ...(input.status ? { status: input.status } : {}),
          ...(!isHrAdmin ? { performedById: profile.id } : {}),
        },
        include: {
          template: { select: { id: true, title: true } },
          location: { select: { id: true, name: true } },
          performedBy: { select: { id: true, fullName: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getRecord: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.inspectionRecord.findUnique({
        where: { id: input.id },
        include: {
          template: {
            include: { items: { orderBy: { order: "asc" } } },
          },
          location: { select: { id: true, name: true } },
          performedBy: { select: { id: true, fullName: true } },
          responses: true,
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      const { profile } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      if (!isHrAdmin && record.performedById !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return record;
    }),

  startRecord: profileProcedure
    .input(
      z.object({
        templateId: z.string(),
        locationId: z.string().optional(),
        title: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.inspectionRecord.create({
        data: {
          title: input.title,
          templateId: input.templateId,
          locationId: input.locationId,
          performedById: ctx.profile.id,
        },
      });
    }),

  saveResponse: profileProcedure
    .input(
      z.object({
        recordId: z.string(),
        itemId: z.string(),
        answer: z.enum(["YES", "NO", "PARTIAL", "NA"]),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.inspectionRecord.findUnique({
        where: { id: input.recordId },
        select: { performedById: true, status: true },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Runden er allerede avsluttet" });
      }
      const { profile } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      if (!isHrAdmin && record.performedById !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.inspectionResponse.upsert({
        where: { recordId_itemId: { recordId: input.recordId, itemId: input.itemId } },
        create: {
          recordId: input.recordId,
          itemId: input.itemId,
          answer: input.answer,
          comment: input.comment,
        },
        update: {
          answer: input.answer,
          comment: input.comment,
        },
      });
    }),

  completeRecord: profileProcedure
    .input(
      z.object({
        recordId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.inspectionRecord.findUnique({
        where: { id: input.recordId },
        select: { performedById: true },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      const { profile } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      if (!isHrAdmin && record.performedById !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.inspectionRecord.update({
        where: { id: input.recordId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: input.notes,
        },
      });
    }),
});
