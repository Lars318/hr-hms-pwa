import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";

export const notificationRouter = router({
  // ── list – brukerens varsler, nyeste først ──────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
        take: z.number().int().min(1).max(50).optional().default(20),
        skip: z.number().int().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      return db.notification.findMany({
        where: {
          recipientId: profile.id,
          ...(input.unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.take,
        skip: input.skip,
      });
    }),

  // ── unreadCount ─────────────────────────────────────────────────────────
  unreadCount: profileProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { recipientId: ctx.profile.id, readAt: null },
    });
    return { count };
  }),

  // ── markAsRead ──────────────────────────────────────────────────────────
  markAsRead: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      // Verify ownership before marking
      const notif = await db.notification.findUnique({ where: { id: input.id } });
      if (!notif || notif.recipientId !== profile.id) return { ok: true };
      if (notif.readAt) return { ok: true };

      await db.notification.update({
        where: { id: input.id },
        data: { readAt: new Date() },
      });
      return { ok: true };
    }),

  // ── markAllAsRead ────────────────────────────────────────────────────────
  markAllAsRead: profileProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { recipientId: ctx.profile.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }),
});
