"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center max-w-sm mx-auto">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Noe gikk galt</h2>
      <p className="text-sm text-muted-foreground">
        En uventet feil oppstod. Feilen er automatisk rapportert.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">Ref: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline" size="sm">
        Prøv igjen
      </Button>
    </div>
  );
}
