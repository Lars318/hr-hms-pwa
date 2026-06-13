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
    <html lang="nb">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-xl font-semibold">Kritisk feil</h1>
            <p className="text-sm text-gray-600">
              En kritisk feil oppstod i applikasjonen. Feilen er automatisk rapportert.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 font-mono">
                Referanse: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                background: "#0f172a",
                color: "#fff",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Last inn på nytt
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
