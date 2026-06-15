"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

type ContractStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: "DRAFT", label: "Utkast" },
  { value: "ACTIVE", label: "Aktiv" },
  { value: "EXPIRED", label: "Utløpt" },
  { value: "TERMINATED", label: "Avsluttet" },
];

interface Props {
  id: string;
  currentStatus: ContractStatus;
  currentTitle: string;
  currentNotes: string;
  sharedWithEmployee: boolean;
}

export function ContractEditForm({ id, currentStatus, currentTitle, currentNotes, sharedWithEmployee }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ContractStatus>(currentStatus);
  const [title, setTitle] = useState(currentTitle);
  const [notes, setNotes] = useState(currentNotes);
  const [saved, setSaved] = useState(false);

  const update = trpc.contract.update.useMutation({
    onSuccess: () => { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); },
  });

  const share = trpc.contract.share.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Tittel</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notat</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
      {saved && <p className="text-sm text-green-600">Lagret.</p>}

      <div className="flex gap-3 flex-wrap">
        <Button size="sm" disabled={update.isPending}
          onClick={() => update.mutate({ id, status, title: title.trim(), notes: notes.trim() || undefined })}>
          {update.isPending ? "Lagrer..." : "Lagre"}
        </Button>

        {!sharedWithEmployee && (
          <Button size="sm" variant="outline" disabled={share.isPending}
            onClick={() => share.mutate(id)}>
            <Share2 className="h-4 w-4 mr-1.5" />
            {share.isPending ? "..." : "Del med ansatt"}
          </Button>
        )}
        {sharedWithEmployee && (
          <span className="text-xs text-muted-foreground self-center">Delt med ansatt</span>
        )}
      </div>
    </div>
  );
}
