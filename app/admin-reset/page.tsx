"use client";

import { useState } from "react";

// Temporary page – delete after use
export default function AdminResetPage() {
  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setStatus("Passordene er ikke like."); return; }
    if (password.length < 8) { setStatus("Passordet må være minst 8 tegn."); return; }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/reset-pw", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-reset-secret": secret },
      body: JSON.stringify({ userId: "ad154d3a-92b1-41d9-a432-c41a409d9648", password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) setStatus("✅ Passord satt! Gå til /login og logg inn.");
    else setStatus("❌ Feil: " + data.error);
  }

  return (
    <main style={{ maxWidth: 400, margin: "100px auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>Admin: Sett passord</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Reset secret" type="password" value={secret} onChange={e => setSecret(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} required />
        <input placeholder="Nytt passord (min 8 tegn)" type="password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} required />
        <input placeholder="Bekreft passord" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} required />
        <button type="submit" disabled={loading}
          style={{ padding: 10, background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
          {loading ? "Lagrer…" : "Sett passord"}
        </button>
      </form>
      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
