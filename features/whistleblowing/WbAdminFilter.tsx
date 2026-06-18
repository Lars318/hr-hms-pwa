"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WbAdminFilterInner() {
  const router = useRouter();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/varsling/admin?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        defaultValue={sp.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-lg border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">Alle statuser</option>
        <option value="RECEIVED">Mottatt</option>
        <option value="UNDER_REVIEW">Under vurdering</option>
        <option value="INVESTIGATING">Undersøkes</option>
        <option value="ACTION_REQUIRED">Tiltak kreves</option>
        <option value="CLOSED">Lukket</option>
        <option value="REJECTED">Avvist</option>
      </select>

      <select
        defaultValue={sp.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className="rounded-lg border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">Alle kategorier</option>
        <option value="HARASSMENT">Trakassering</option>
        <option value="DISCRIMINATION">Diskriminering</option>
        <option value="SAFETY">Sikkerhetsbrudd / HMS</option>
        <option value="FINANCIAL_MISCONDUCT">Økon. misligheter</option>
        <option value="ETHICS">Uetisk atferd</option>
        <option value="RETALIATION">Gjengjeldelse</option>
        <option value="OTHER">Annet</option>
      </select>

      <select
        defaultValue={sp.get("severity") ?? ""}
        onChange={(e) => update("severity", e.target.value)}
        className="rounded-lg border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">Alle alvorligheter</option>
        <option value="LOW">Lav</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">Høy</option>
        <option value="CRITICAL">Kritisk</option>
      </select>
    </div>
  );
}

export function WbAdminFilter() {
  return (
    <Suspense>
      <WbAdminFilterInner />
    </Suspense>
  );
}
