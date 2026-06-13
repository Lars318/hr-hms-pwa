import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Session replay — mask all text/media to avoid leaking sensitive HR data
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    beforeSend(event) {
      return scrubSensitiveData(event);
    },

    // Don't send browser extension errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
    ],
  });
}

/**
 * Remove PII and sensitive HR/HMS data before sending to Sentry.
 * Strips known sensitive field names from request bodies and extra context.
 */
function scrubSensitiveData(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  // Strip request body (may contain tRPC mutation payloads with descriptions/reasons)
  if (event.request?.data) {
    event.request.data = "[scrubbed]";
  }

  // Strip known sensitive keys from extra context
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  return event;
}

const SENSITIVE_KEYS = new Set([
  "email", "password", "description", "reason", "managerComment",
  "message", "body", "content", "p256dh", "auth", "endpoint",
  "name", "firstName", "lastName",
]);

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[scrubbed]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
