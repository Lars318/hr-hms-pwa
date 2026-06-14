"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

type ProcessStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

interface Props {
  id: string;
  currentStatus: ProcessStatus;
  currentNotes: string;
}

const OPTIONS: { value: ProcessStatus; label: string }[] = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "COMPLETED", label: "Fullført" },
  { value: "CANCELLED", label: "Avbrutt" },
];

export function ProcessStatusForm({ id, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ProcessStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saved, setSaved] = useState(false);

  const update = trpc.onboarding.updateProcess.useMutation({
    onSuccess: () => { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); },
  });

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <h2 className="text-sm font-semibold">Status og notat</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as ProcessStatus)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notat (internt)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
      {saved && <p className="text-sm text-green-600">Lagret.</p>}

      <Button size="sm" disabled={update.isPending}
        onClick={() => update.mutate({ id, status, notes: notes.trim() || undefined })}>
        {update.isPending ? "Lagrer..." : "Lagre"}
      </Button>
    </div>
  );
}
