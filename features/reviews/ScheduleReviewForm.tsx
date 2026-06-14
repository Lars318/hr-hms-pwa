"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

interface Profile { id: string; fullName: string }

export function ScheduleReviewForm({ employees, managers }: { employees: Profile[]; managers: Profile[] }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.review.create.useMutation({
    onSuccess: (r) => router.push(`/medarbeidersamtaler/${r.id}`),
    onError: (e) => setError(e.message),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setError(null);
      if (!employeeId || !managerId || !scheduledAt) {
        setError("Fyll ut ansatt, leder og tidspunkt");
        return;
      }
      create.mutate({ employeeId, managerId, scheduledAt, location: location || undefined, agenda: agenda || undefined });
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
          <label className="text-sm font-medium">Leder *</label>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Velg leder...</option>
            {managers.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tidspunkt *</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sted/rom</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="F.eks. møterom 2"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Agenda (valgfri)</label>
        <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3}
          placeholder="Hva skal tas opp i samtalen..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={create.isPending}>
        {create.isPending ? "Oppretter..." : "Planlegg samtale"}
      </Button>
    </form>
  );
}
