"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { IncidentStatus, Role } from "@prisma/client";

const statusOptions: { value: IncidentStatus; label: string }[] = [
  { value: "OPEN", label: "Åpen" },
  { value: "IN_PROGRESS", label: "Under arbeid" },
  { value: "RESOLVED", label: "Løst" },
  { value: "CLOSED", label: "Lukket" },
];

interface StatusChangeFormProps {
  incidentId: string;
  currentStatus: IncidentStatus;
  viewerRole: Role;
}

export function StatusChangeForm({ incidentId, currentStatus, viewerRole }: StatusChangeFormProps) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<IncidentStatus>(currentStatus);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = trpc.incident.changeStatus.useMutation({
    onSuccess: () => {
      utils.incident.byId.invalidate({ id: incidentId });
      utils.incident.list.invalidate();
      setOpen(false);
      setComment("");
    },
  });

  if (viewerRole === "EMPLOYEE") return null;

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Endre status
      </Button>
    );
  }

  return (
    <div className="rounded-md border p-4 space-y-3 bg-muted/30">
      <div className="space-y-1">
        <Label htmlFor="new-status">Ny status</Label>
        <Select
          id="new-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as IncidentStatus)}
          className="w-48"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="status-comment">Kommentar (valgfri)</Label>
        <Textarea
          id="status-comment"
          rows={2}
          placeholder="Legg til en kommentar til statusendringen…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {mutation.error && <p className="text-xs text-destructive">{mutation.error.message}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={mutation.isPending || status === currentStatus}
          onClick={() => mutation.mutate({ id: incidentId, status, comment: comment || undefined })}
        >
          {mutation.isPending ? "Lagrer…" : "Bekreft"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setStatus(currentStatus); }}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
