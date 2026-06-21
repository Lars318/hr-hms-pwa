"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";

export function PasskeyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth() {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/auth-options", { method: "POST" });
      const text = await optRes.text();
      if (!text) throw new Error(`Tomt svar fra server (${optRes.status})`);
      const options = JSON.parse(text);
      if (!optRes.ok) throw new Error(options.error ?? "Feil ved henting av passkey-opsjoner");

      const authResponse = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/webauthn/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authResponse }),
      });
      const verifyText = await verifyRes.text();
      if (!verifyText) throw new Error(`Tomt svar fra server (${verifyRes.status})`);
      const verifyData = JSON.parse(verifyText);
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verifisering feilet");

      window.location.href = verifyData.callbackUrl ?? "/dashboard";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("cancelled") && !msg.includes("NotAllowedError")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleAuth}
        disabled={loading}
        type="button"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Fingerprint className="h-4 w-4" />}
        {loading ? "Autentiserer..." : "Logg inn med Face ID"}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}
