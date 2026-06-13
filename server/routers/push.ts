import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { sendPushToProfile } from "@/lib/push/sendPushNotification";

export const pushRouter = router({
  // ── getPublicKey ──────────────────────────────────────────────────────────
  // Returns the VAPID public key so the client can call pushManager.subscribe().
  // Uses NEXT_PUBLIC_VAPID_PUBLIC_KEY which is already public.
  getPublicKey: profileProcedure.query(() => {
    return { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "" };
  }),

  // ── subscribe ─────────────────────────────────────────────────────────────
  subscribe: profileProcedure
    .input(
      z.object({
        endpoint: z.string().url().max(500),
        p256dh: z.string().min(1).max(300),
        auth: z.string().min(1).max(100),
        userAgent: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = ctx;

      // Upsert by endpoint — re-registering the same device re-activates it
      return db.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: {
          profileId: profile.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
          lastUsedAt: new Date(),
        },
        update: {
          profileId: profile.id,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
          revokedAt: null, // re-activate if previously revoked
          lastUsedAt: new Date(),
        },
        select: { id: true },
      });
    }),

  // ── unsubscribe ───────────────────────────────────────────────────────────
  unsubscribe: profileProcedure
    .input(z.object({ endpoint: z.string().url().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = ctx;

      // Only revoke subscriptions that belong to the current profile
      await db.pushSubscription.updateMany({
        where: { endpoint: input.endpoint, profileId: profile.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    }),

  // ── status ────────────────────────────────────────────────────────────────
  status: profileProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.pushSubscription.count({
      where: { profileId: ctx.profile.id, revokedAt: null },
    });
    return { activeSubscriptions: count };
  }),

  // ── test ──────────────────────────────────────────────────────────────────
  test: profileProcedure.mutation(async ({ ctx }) => {
    await sendPushToProfile(ctx.db, ctx.profile.id, {
      title: "Testvarsel – HR/HMS",
      body: "Push-varsler er aktivert og fungerer korrekt.",
      url: "/varsler",
      type: "TEST",
    });
    return { sent: true };
  }),
});
