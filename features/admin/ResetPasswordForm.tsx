"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link2 } from "lucide-react";

interface Profile {
  id: string;
  fullName: string;
  email: string;
  supabaseUserId: string;
}

type Tab = "password" | "link";

export function ResetPasswordForm({ profiles }: { profiles: Profile[] }) {
  const [tab, setTab] = useState<Tab>("password");

  // --- passord-tab ---
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // --- magic link-tab ---
  const [linkEmail, setLinkEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (password !== confirm) { setPwStatus({ ok: false, message: "Passordene er ikke like." }); return; }
    if (password.length < 8) { setPwStatus({ ok: false, message: "Passordet må være minst 8 tegn." }); return; }

    setPwLoading(true);
    setPwStatus(null);

    const res = await fetch("/api/admin/reset-pw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supabaseUserId: selected.supabaseUserId, password }),
    });

    const data = await res.json() as { ok?: boolean; error?: string; debug?: { status: number; urlProject: string } };
    setPwLoading(false);

    if (data.ok) {
      setPwStatus({ ok: true, message: `Passord for ${selected.fullName} er oppdatert.` });
      setPassword("");
      setConfirm("");
    } else {
      const debug = data.debug ? ` [status=${data.debug.status} proj=${data.debug.urlProject}]` : "";
      setPwStatus({ ok: false, message: (data.error ?? "Noe gikk galt.") + debug });
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkEmail) return;
    setLinkLoading(true);
    setLinkStatus(null);
    setGeneratedLink(null);

    const res = await fetch("/api/admin/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: linkEmail }),
    });

    const data = await res.json() as { ok?: boolean; link?: string; error?: string };
    setLinkLoading(false);

    if (data.ok && data.link) {
      setGeneratedLink(data.link);
      setLinkStatus({ ok: true, message: "Lenken er klar. Del den med brukeren – den er gyldig én gang." });
    } else {
      setLinkStatus({ ok: false, message: data.error ?? "Noe gikk galt." });
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Tab-velger */}
      <div className="flex rounded-lg border p-1 gap-1 bg-muted/30">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "password" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sett passord
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "link" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          Innloggingslenke
        </button>
      </div>

      {/* Sett passord */}
      {tab === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="user">Ansatt</Label>
            <select
              id="user"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Velg ansatt…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nytt passord</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Bekreft passord</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>

          {pwStatus && (
            <p className={`text-sm ${pwStatus.ok ? "text-green-600" : "text-destructive"}`}>{pwStatus.message}</p>
          )}

          <Button type="submit" disabled={pwLoading || !selectedId} className="w-full">
            {pwLoading ? "Lagrer…" : "Sett passord"}
          </Button>
        </form>
      )}

      {/* Innloggingslenke */}
      {tab === "link" && (
        <form onSubmit={handleMagicLink} className="space-y-4 rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Generer en engangslenke som logger brukeren rett inn – ingen e-post nødvendig.
            Lenken er gyldig i 24 timer og kun én gang.
          </p>

          <div className="space-y-2">
            <Label htmlFor="linkEmail">E-post</Label>
            <select
              id="linkEmail"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Velg ansatt…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.email}>{p.fullName} ({p.email})</option>
              ))}
            </select>
          </div>

          {linkStatus && (
            <p className={`text-sm ${linkStatus.ok ? "text-green-600" : "text-destructive"}`}>{linkStatus.message}</p>
          )}

          {generatedLink && (
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="text-xs font-mono truncate bg-muted"
              />
              <Button type="button" variant="outline" size="icon" onClick={copyLink} title="Kopier lenke">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          <Button type="submit" disabled={linkLoading || !linkEmail} className="w-full">
            {linkLoading ? "Genererer…" : "Generer innloggingslenke"}
          </Button>
        </form>
      )}
    </div>
  );
}
