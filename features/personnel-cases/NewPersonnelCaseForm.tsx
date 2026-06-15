"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = [
  { value: "WARNING", label: "Skriftlig advarsel" },
  { value: "PERFORMANCE_PLAN", label: "Oppfølgingsplan (PIP)" },
  { value: "TERMINATION_NOTICE", label: "Varsel om oppsigelse" },
  { value: "SUSPENSION", label: "Suspensjon" },
  { value: "OTHER", label: "Annet" },
] as const;

interface Profile { id: string; fullName: string }

export function NewPersonnelCaseForm({ employees, managers }: { employees: Profile[]; managers: Profile[] }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<typeof TYPE_OPTIONS[number]["value"]>("WARNING");
  const [summary, setSummary] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [responsibleManagerId, setResponsibleManagerId] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const create = trpc.personnelCase.create.useMutation({
    onSuccess: (c) => router.push(`/admin/personalsaker/${c.id}`),
    onError: (e) => setError(e.message),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setError(null);
      if (!employeeId || !summary.trim()) { setError("Fyll ut ansatt og beskrivelse"); return; }
      create.mutate({
        employeeId, type, summary: summary.trim(),
        internalNote: internalNote.trim() || undefined,
        responsibleManagerId: responsibleManagerId || undefined,
        issuedAt,
      });
    }} className="space-y-4">
      <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
        Svært sensitiv informasjon — kun HR og ADMIN har tilgang. Leder tildeles eksplisitt per sak.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Ansatt *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Velg ansatt...</option>
            {employees.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Dato *</label>
          <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tildelt leder (valgfri)</label>
          <select value={responsibleManagerId} onChange={(e) => setResponsibleManagerId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Ingen</option>
            {managers.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Beskrivelse *</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
          placeholder="Faktabeskrivelse av saken..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Intern HR-notat
          <span className="text-muted-foreground font-normal ml-1">(kun for HR/ADMIN, aldri synlig for ansatt eller leder)</span>
        </label>
        <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={3}
          placeholder="Interne vurderinger og prosessnotater..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={create.isPending}>
        {create.isPending ? "Oppretter..." : "Opprett sak"}
      </Button>
    </form>
  );
}
