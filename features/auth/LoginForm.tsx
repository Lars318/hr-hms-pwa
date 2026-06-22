"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    // Handle ?code= from Supabase email links (magic link / PKCE)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=/dashboard`;
      return;
    }
    // Handle #type=recovery fragment
    if (window.location.hash.includes("type=recovery")) {
      window.location.href = "/auth/update-password" + window.location.hash;
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("Feil e-post eller passord.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail) return;
    setError(null);
    setMagicLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setMagicSent(true);
    } catch {
      setError("Kunne ikke sende e-post. Prøv igjen.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Password login */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="navn@bedrift.no"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Passord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logger inn…" : "Logg inn"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">eller</span>
        </div>
      </div>

      {/* Magic link */}
      {magicSent ? (
        <p className="text-sm text-center text-muted-foreground">
          ✅ Sjekk e-posten din for en innloggingslenke.
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-2">
          <Label htmlFor="magic-email">Logg inn med magisk lenke</Label>
          <div className="flex gap-2">
            <Input
              id="magic-email"
              type="email"
              autoComplete="email"
              placeholder="navn@bedrift.no"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="outline" disabled={magicLoading}>
              {magicLoading ? "…" : "Send"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
