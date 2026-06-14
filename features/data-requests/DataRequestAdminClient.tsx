"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "PENDING", label: "Til behandling" },
  { value: "IN_PROGRESS", label: "Under behandling" },
  { value: "COMPLETED", label: "Fullført" },
  { value: "REJECTED", label: "Avslått" },
];

interface Props {
  id: string;
  currentStatus: Status;
  currentAdminNote: string;
}

export function DataRequestAdminClient({ id, currentStatus, currentAdminNote }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(currentStatus);
  const [adminNote, setAdminNote] = useState(currentAdminNote);
  const [saved, setSaved] = useState(false);

  const update = trpc.dataRequest.updateStatus.useMutation({
    onSuccess: () => { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); },
  });

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <h2 className="text-sm font-semibold">Oppdater status</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Status *</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Merknad til ansatt (valgfri)</label>
        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3}
          placeholder="Beskriv hva som ble gjort eller årsak til avslag..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {update.isError && (
        <p className="text-sm text-destructive">{update.error.message}</p>
      )}
      {saved && (
        <p className="text-sm text-green-600">Lagret.</p>
      )}

      <Button size="sm" disabled={update.isPending}
        onClick={() => update.mutate({ id, status, adminNote: adminNote.trim() || undefined })}>
        {update.isPending ? "Lagrer..." : "Lagre"}
      </Button>
    </div>
  );
}
