"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <h2 className="text-xl font-semibold">Noe gikk galt</h2>
        <p className="text-sm text-muted-foreground">
          En uventet feil oppstod. Feilen er automatisk rapportert.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Referanse: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    </div>
  );
}
