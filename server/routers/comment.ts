import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

const ENTITY_TYPES = ["INCIDENT", "ACTION", "RISK_ASSESSMENT"] as const;

export const commentRouter = router({
  list: profileProcedure
    .input(z.object({
      entityType: z.enum(ENTITY_TYPES),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      const isPrivileged = role === "ADMIN" || role === "HR" || role === "MANAGER";

      return db.comment.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          // EMPLOYEE sees only non-internal comments
          ...(isPrivileged ? {} : { isInternal: false }),
        },
        include: {
          author: { select: { id: true, fullName: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: profileProcedure
    .input(z.object({
      entityType: z.enum(ENTITY_TYPES),
      entityId: z.string(),
      body: z.string().min(1).max(2000),
      isInternal: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      const isPrivileged = role === "ADMIN" || role === "HR" || role === "MANAGER";

      // Only privileged users can post internal comments
      if (input.isInternal && !isPrivileged) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kun HR, ADMIN og leder kan poste interne kommentarer." });
      }

      return db.comment.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          body: input.body.trim(),
          isInternal: isPrivileged ? input.isInternal : false,
          authorId: ctx.profile.id,
        },
        include: {
          author: { select: { id: true, fullName: true, title: true } },
        },
      });
    }),

  update: profileProcedure
    .input(z.object({
      id: z.string(),
      body: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await db.comment.findUnique({ where: { id: input.id } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });

      const role = ctx.profile.role;
      const isHrAdmin = role === "ADMIN" || role === "HR";
      if (comment.authorId !== ctx.profile.id && !isHrAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.comment.update({
        where: { id: input.id },
        data: { body: input.body.trim(), editedAt: new Date() },
        include: { author: { select: { id: true, fullName: true, title: true } } },
      });
    }),

  delete: profileProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const comment = await db.comment.findUnique({ where: { id: input } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });

      const role = ctx.profile.role;
      const isHrAdmin = role === "ADMIN" || role === "HR";
      if (comment.authorId !== ctx.profile.id && !isHrAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.comment.delete({ where: { id: input } });
    }),
});
