"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fingerprint, Loader2 } from "lucide-react";

export function PasskeyButton() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "auth">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function parseJsonOrThrow(res: Response, label: string) {
    const text = await res.text();
    if (!text) throw new Error(`${label}: tomt svar fra server (status ${res.status})`);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${label}: ugyldig svar fra server — ${text.slice(0, 120)}`);
    }
  }

  async function handleAuth() {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const optData = await parseJsonOrThrow(optRes, "auth-options");
      if (!optRes.ok) throw new Error(optData.error ?? "Feil ved henting av passkey-opsjoner");

      const authResponse = await startAuthentication({ optionsJSON: optData });

      const verifyRes = await fetch("/api/auth/webauthn/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, authResponse }),
      });

      const verifyData = await parseJsonOrThrow(verifyRes, "auth-verify");
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verifisering feilet");

      router.push(verifyData.redirectTo ?? "/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("cancelled") && !msg.includes("NotAllowedError")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="E-postadresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && setStep("auth")}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={() => email && setStep("auth")}
            disabled={!email}
          >
            <Fingerprint className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {loading ? "Autentiserer..." : "Logg inn med Face ID / passkey"}
      </Button>
      <button
        className="text-xs text-muted-foreground hover:underline w-full text-center"
        onClick={() => { setStep("email"); setError(null); }}
      >
        Bruk annen e-post
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
