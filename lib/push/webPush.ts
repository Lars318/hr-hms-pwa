// Server-only — never import in Client Components.
import webpush from "web-push";

let _configured = false;

function configure() {
  if (_configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set when PUSH_NOTIFICATIONS_ENABLED=true");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  _configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  notificationId?: string;
  type?: string;
}

interface PushKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  success: boolean;
  /** true = endpoint is gone (410/404) — caller should revoke the subscription */
  gone: boolean;
}

/**
 * Send a Web Push notification to a single subscription.
 * When PUSH_NOTIFICATIONS_ENABLED != "true", only logs to console (dev mode).
 * Never throws — caller receives a PushResult instead.
 */
export async function sendWebPush(sub: PushKeys, payload: PushPayload): Promise<PushResult> {
  if (process.env.PUSH_NOTIFICATIONS_ENABLED !== "true") {
    console.log(
      `[push:dev] Would push to …${sub.endpoint.slice(-20)} — "${payload.title}" (PUSH_NOTIFICATIONS_ENABLED=false)`
    );
    return { success: true, gone: false };
  }

  configure();

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 24 * 60 * 60 } // 1 day — deliver even if device is briefly offline
    );
    return { success: true, gone: false };
  } catch (err: unknown) {
    const statusCode =
      (err as { statusCode?: number })?.statusCode ??
      (err as { response?: { statusCode?: number } })?.response?.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return { success: false, gone: true };
    }

    console.error("[push] sendNotification failed:", err);
    return { success: false, gone: false };
  }
}
