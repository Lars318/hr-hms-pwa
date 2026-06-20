import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";

export const documentCategoryRouter = router({
  list: profileProcedure.query(({ ctx }) =>
    ctx.db.documentCategoryLabel.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ),

  create: hrProcedure
    .input(z.object({ name: z.string().min(1).max(80), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const last = await ctx.db.documentCategoryLabel.findFirst({ orderBy: { sortOrder: "desc" } });
      return ctx.db.documentCategoryLabel.create({
        data: { name: input.name, color: input.color ?? "#5F5E5A", sortOrder: (last?.sortOrder ?? 0) + 1 },
      });
    }),

  update: hrProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(80).optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.documentCategoryLabel.update({ where: { id }, data });
    }),

  delete: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.document.count({ where: { customCategoryId: input.id } });
      if (count > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Kategorien er i bruk av ${count} dokument(er). Flytt dem først.`,
        });
      }
      return ctx.db.documentCategoryLabel.delete({ where: { id: input.id } });
    }),
});
