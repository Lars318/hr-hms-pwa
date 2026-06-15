"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = [
  { value: "EMPLOYMENT", label: "Ansettelseskontrakt" },
  { value: "AMENDMENT", label: "Tillegg/endring" },
  { value: "TERMINATION", label: "Opphørsavtale" },
  { value: "OTHER", label: "Annet" },
] as const;

interface Profile { id: string; fullName: string }

export function NewContractForm({ employees }: { employees: Profile[] }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<typeof TYPE_OPTIONS[number]["value"]>("EMPLOYMENT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.contract.create.useMutation({
    onSuccess: (c) => router.push(`/kontrakter/${c.id}`),
    onError: (e) => setError(e.message),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setError(null);
      if (!employeeId || !title.trim()) { setError("Fyll ut ansatt og tittel"); return; }
      create.mutate({ employeeId, title: title.trim(), type, startDate: startDate || undefined, endDate: endDate || undefined, notes: notes.trim() || undefined });
    }} className="space-y-3">
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
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Tittel *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks. Ansettelseskontrakt – Lars Hansen"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Startdato</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sluttdato (valgfri)</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Notat (valgfri)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={create.isPending}>
        {create.isPending ? "Oppretter..." : "Opprett kontrakt"}
      </Button>
    </form>
  );
}
