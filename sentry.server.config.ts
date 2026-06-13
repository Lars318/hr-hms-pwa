import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    beforeSend(event) {
      // Strip request bodies — tRPC mutations may contain sensitive HR data
      if (event.request?.data) {
        event.request.data = "[scrubbed]";
      }
      // Strip query strings that might contain tokens
      if (event.request?.query_string) {
        event.request.query_string = "[scrubbed]";
      }
      return event;
    },
  });
}
