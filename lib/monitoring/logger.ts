import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

// Fields that must never appear in logs
const REDACTED_KEYS = new Set([
  "email", "password", "description", "reason", "managerComment",
  "p256dh", "auth", "endpoint", "body", "content",
  "name", "firstName", "lastName", "token", "apiKey",
]);

function redact(ctx: LogContext): LogContext {
  const result: LogContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) {
      result[k] = "[redacted]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = redact(v as LogContext);
    } else {
      result[k] = v;
    }
  }
  return result;
}

function log(level: LogLevel, message: string, ctx?: LogContext) {
  const safe = ctx ? redact(ctx) : undefined;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(safe ?? {}),
  };

  if (process.env.NODE_ENV === "production") {
    // Structured JSON for log aggregators (Vercel, Datadog, etc.)
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      JSON.stringify(entry)
    );
  } else {
    const prefix = `[${level.toUpperCase()}]`;
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      prefix,
      message,
      safe ?? ""
    );
  }
}

export const logger = {
  info(message: string, ctx?: LogContext) {
    log("info", message, ctx);
  },

  warn(message: string, ctx?: LogContext) {
    log("warn", message, ctx);
  },

  error(message: string, error?: unknown, ctx?: LogContext) {
    log("error", message, ctx);
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: ctx ? redact(ctx) : undefined });
    }
  },
};
