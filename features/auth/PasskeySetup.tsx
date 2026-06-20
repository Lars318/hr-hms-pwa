"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  hasPasskey: boolean;
}

export function PasskeySetup({ hasPasskey }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/register-options");
      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error ?? "Feil ved henting av opsjoner");
      }
      const options = await optRes.json();
      const regResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error ?? "Registrering feilet");
      }

      setDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("cancelled") && !msg.includes("NotAllowedError")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done || hasPasskey) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Face ID / passkey er aktivert</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="gap-2" onClick={handleRegister} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {loading ? "Registrerer..." : "Aktiver Face ID / passkey"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
