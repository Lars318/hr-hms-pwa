"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

type CaseStatus = "OPEN" | "CLOSED" | "ARCHIVED";

interface Props {
  id: string;
  isHrAdmin: boolean;
  currentStatus: CaseStatus;
  summary: string;
  internalNote: string | null;
  outcomeNote: string | null;
  isAcknowledged: boolean;
}

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "OPEN", label: "Åpen" },
  { value: "CLOSED", label: "Avsluttet" },
  { value: "ARCHIVED", label: "Arkivert" },
];

export function PersonnelCaseEditForm({ id, isHrAdmin, currentStatus, summary, internalNote, outcomeNote, isAcknowledged }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<CaseStatus>(currentStatus);
  const [summaryVal, setSummaryVal] = useState(summary);
  const [internalVal, setInternalVal] = useState(internalNote ?? "");
  const [outcomeVal, setOutcomeVal] = useState(outcomeNote ?? "");
  const [saved, setSaved] = useState(false);

  const update = trpc.personnelCase.update.useMutation({
    onSuccess: () => { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); },
  });

  const acknowledge = trpc.personnelCase.acknowledge.useMutation({
    onSuccess: () => router.refresh(),
  });

  const handleSave = () => {
    update.mutate({
      id,
      status,
      summary: summaryVal.trim(),
      ...(isHrAdmin ? { internalNote: internalVal.trim() || undefined } : {}),
      outcomeNote: outcomeVal.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Beskrivelse</label>
        <textarea value={summaryVal} onChange={(e) => setSummaryVal(e.target.value)} rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {isHrAdmin && (
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Intern HR-notat
            <span className="text-muted-foreground font-normal ml-1">(aldri synlig for ansatt/leder)</span>
          </label>
          <textarea value={internalVal} onChange={(e) => setInternalVal(e.target.value)} rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Utfall/konklusjon</label>
        <textarea value={outcomeVal} onChange={(e) => setOutcomeVal(e.target.value)} rows={3}
          placeholder="Hva ble resultatet av saken..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
      {saved && <p className="text-sm text-green-600">Lagret.</p>}

      <div className="flex gap-3 flex-wrap">
        <Button size="sm" disabled={update.isPending} onClick={handleSave}>
          {update.isPending ? "Lagrer..." : "Lagre"}
        </Button>
        {!isAcknowledged && isHrAdmin && (
          <Button size="sm" variant="outline" disabled={acknowledge.isPending}
            onClick={() => acknowledge.mutate(id)}>
            {acknowledge.isPending ? "..." : "Marker som mottatt av ansatt"}
          </Button>
        )}
      </div>
    </div>
  );
}
