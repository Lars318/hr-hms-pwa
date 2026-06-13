import type { PrismaClient } from "@prisma/client";
import { sendWebPush } from "./webPush";
import type { PushPayload } from "./webPush";

const MAX_BODY_LENGTH = 120;

function truncate(text: string): string {
  return text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH - 1) + "…" : text;
}

/**
 * Send a push notification to all active subscriptions for a profile.
 * Fire-and-forget safe: never throws, soft-deletes expired subscriptions.
 */
export async function sendPushToProfile(
  db: PrismaClient,
  profileId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { profileId, revokedAt: null },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const safePayload: PushPayload = {
    ...payload,
    body: truncate(payload.body),
  };

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        safePayload
      );

      if (result.gone) {
        // Endpoint is expired or unregistered — soft-delete
        await db.pushSubscription
          .update({ where: { id: sub.id }, data: { revokedAt: new Date() } })
          .catch(() => {});
      } else if (result.success) {
        await db.pushSubscription
          .update({ where: { id: sub.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
      }
    })
  );
}
