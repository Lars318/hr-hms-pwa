"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

type ReviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

interface Props {
  id: string;
  role: Role;
  isManager: boolean;
  currentStatus: ReviewStatus;
  sharedNotes: string | null;
  managerNotes: string | null;
  goals: string | null;
  agenda: string | null;
}

export function ReviewNotesForm({ id, role, isManager, currentStatus, sharedNotes, managerNotes, goals, agenda }: Props) {
  const router = useRouter();
  const isHrAdmin = role === "ADMIN" || role === "HR";
  const canEditNotes = isHrAdmin || isManager;

  const [shared, setShared] = useState(sharedNotes ?? "");
  const [mgrNotes, setMgrNotes] = useState(managerNotes ?? "");
  const [goalsVal, setGoalsVal] = useState(goals ?? "");
  const [agendaVal, setAgendaVal] = useState(agenda ?? "");
  const [status, setStatus] = useState<ReviewStatus>(currentStatus);
  const [saved, setSaved] = useState(false);

  const update = trpc.review.update.useMutation({
    onSuccess: () => { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSave = () => {
    const payload: Parameters<typeof update.mutate>[0] = { id, sharedNotes: shared };
    if (canEditNotes) {
      payload.managerNotes = mgrNotes;
      payload.goals = goalsVal;
    }
    if (isHrAdmin) {
      payload.status = status;
      payload.agenda = agendaVal;
    }
    update.mutate(payload);
  };

  const isEmployee = role === "EMPLOYEE";

  return (
    <div className="space-y-4">
      {isHrAdmin && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Agenda</label>
          <textarea value={agendaVal} onChange={(e) => setAgendaVal(e.target.value)} rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Felles referat
          <span className="text-muted-foreground font-normal ml-1">(synlig for ansatt, leder og HR)</span>
        </label>
        <textarea value={shared} onChange={(e) => setShared(e.target.value)} rows={4}
          placeholder="Hva ble diskutert og avtalt..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {canEditNotes && (
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Ledernotat
            <span className="text-muted-foreground font-normal ml-1">(kun for leder og HR)</span>
          </label>
          <textarea value={mgrNotes} onChange={(e) => setMgrNotes(e.target.value)} rows={3}
            placeholder="Interne notater – ikke synlig for ansatt..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
      )}

      {canEditNotes && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Mål og oppfølging</label>
          <textarea value={goalsVal} onChange={(e) => setGoalsVal(e.target.value)} rows={3}
            placeholder="Avtalte mål og oppfølgingspunkter..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
      )}

      {isHrAdmin && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="SCHEDULED">Planlagt</option>
            <option value="COMPLETED">Gjennomført</option>
            <option value="CANCELLED">Avlyst</option>
          </select>
        </div>
      )}

      {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
      {saved && <p className="text-sm text-green-600">Lagret.</p>}

      <Button size="sm" disabled={update.isPending} onClick={handleSave}>
        {update.isPending ? "Lagrer..." : "Lagre"}
      </Button>
    </div>
  );
}
