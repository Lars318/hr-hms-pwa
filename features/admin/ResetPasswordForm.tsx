"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  fullName: string;
  email: string;
  supabaseUserId: string;
}

export function ResetPasswordForm({ profiles }: { profiles: Profile[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (password !== confirm) { setStatus({ ok: false, message: "Passordene er ikke like." }); return; }
    if (password.length < 8) { setStatus({ ok: false, message: "Passordet må være minst 8 tegn." }); return; }

    setLoading(true);
    setStatus(null);

    const res = await fetch("/api/admin/reset-pw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supabaseUserId: selected.supabaseUserId, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      setStatus({ ok: true, message: `Passord for ${selected.fullName} er oppdatert.` });
      setPassword("");
      setConfirm("");
    } else {
      const debug = data.debug ? ` [status=${data.debug.status} proj=${data.debug.urlProject}]` : "";
      setStatus({ ok: false, message: (data.error ?? "Noe gikk galt.") + debug });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-5">
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

      {status && (
        <p className={`text-sm ${status.ok ? "text-green-600" : "text-destructive"}`}>{status.message}</p>
      )}

      <Button type="submit" disabled={loading || !selectedId} className="w-full">
        {loading ? "Lagrer…" : "Sett passord"}
      </Button>
    </form>
  );
}
