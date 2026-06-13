"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";

const OVERTIME_TYPE_LABELS: Record<string, string> = {
  OVERTIME: "Overtid (utbetales)",
  TIME_OFF: "Avspasering (trekk fra timebank)",
  ON_CALL: "Beredskapsvakt",
  TRAVEL_TIME: "Reisetid utenom arbeidstid",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Til godkjenning",
  APPROVED: "Godkjent",
  REJECTED: "Avslått",
  CANCELLED: "Kansellert",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-muted text-muted-foreground",
};

interface OvertimeDetailProps {
  entry: {
    id: string;
    date: Date;
    hours: number;
    type: string;
    status: string;
    description: string | null;
    note: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    employeeId: string;
    employee: { id: string; fullName: string; title: string | null };
    approvedBy: { id: string; fullName: string } | null;
    location: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  };
  viewerRole: string;
  viewerId: string;
}

export function OvertimeDetail({ entry, viewerRole, viewerId }: OvertimeDetailProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const utils = trpc.useUtils();

  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";
  const isManager = viewerRole === "MANAGER";
  const isOwner = entry.employeeId === viewerId;
  const canApprove = (isHrAdmin || isManager) && entry.status === "SUBMITTED";
  const canSubmit = isOwner && ["DRAFT", "REJECTED"].includes(entry.status);
  const canCancel = isOwner && ["DRAFT", "SUBMITTED"].includes(entry.status);
  const canEdit = isOwner && ["DRAFT", "REJECTED"].includes(entry.status);

  const submitMutation = trpc.overtime.submit.useMutation({
    onSuccess: () => { utils.overtime.myEntries.invalidate(); success("Sendt til godkjenning!"); router.refresh(); },
    onError: (err) => toastError(err.message),
  });
  const approveMutation = trpc.overtime.approve.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); success("Godkjent!"); router.refresh(); },
    onError: (err) => toastError(err.message),
  });
  const rejectMutation = trpc.overtime.reject.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); success("Avslått."); router.refresh(); },
    onError: (err) => toastError(err.message),
  });
  const cancelMutation = trpc.overtime.cancel.useMutation({
    onSuccess: () => { utils.overtime.myEntries.invalidate(); success("Kansellert."); router.push("/overtid"); },
    onError: (err) => toastError(err.message),
  });

  const statusColor = STATUS_COLORS[entry.status] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4 max-w-lg">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}>
          {STATUS_LABELS[entry.status] ?? entry.status}
        </span>
      </div>

      {/* Detaljer */}
      <div className="rounded-2xl border bg-card divide-y">
        {[
          { label: "Ansatt", value: entry.employee.fullName },
          { label: "Dato", value: format(new Date(entry.date), "d. MMMM yyyy", { locale: nb }) },
          { label: "Timer", value: `${entry.hours}t` },
          { label: "Type", value: OVERTIME_TYPE_LABELS[entry.type] ?? entry.type },
          { label: "Lokasjon", value: entry.location?.name },
          { label: "Avdeling", value: entry.department?.name },
          { label: "Beskrivelse", value: entry.description },
          { label: "Registrert", value: format(new Date(entry.createdAt), "d. MMM yyyy HH:mm", { locale: nb }) },
          entry.approvedBy
            ? { label: entry.status === "APPROVED" ? "Godkjent av" : "Behandlet av", value: `${entry.approvedBy.fullName}${entry.approvedAt ? ` – ${format(new Date(entry.approvedAt), "d. MMM yyyy", { locale: nb })}` : ""}` }
            : null,
          entry.note ? { label: "Kommentar", value: entry.note } : null,
        ]
          .filter(Boolean)
          .map((row) => row && (
            <div key={row.label} className="flex items-start gap-4 px-4 py-3 min-h-[48px]">
              <p className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</p>
              <p className="text-sm">{row.value ?? "–"}</p>
            </div>
          ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        {canSubmit && (
          <Button onClick={() => submitMutation.mutate({ id: entry.id })} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Sender…" : "Send til godkjenning"}
          </Button>
        )}
        {canApprove && (
          <>
            <Button
              onClick={() => approveMutation.mutate({ id: entry.id })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Godkjenner…" : "Godkjenn"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const note = window.prompt("Årsak til avslag (påkrevd):");
                if (note) rejectMutation.mutate({ id: entry.id, note });
              }}
              disabled={rejectMutation.isPending}
            >
              Avslå
            </Button>
          </>
        )}
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/overtid/${entry.id}/rediger`}>Rediger</Link>
          </Button>
        )}
        {canCancel && (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (window.confirm("Er du sikker på at du vil kansellere?")) {
                cancelMutation.mutate({ id: entry.id });
              }
            }}
            disabled={cancelMutation.isPending}
          >
            Kanseller
          </Button>
        )}
      </div>
    </div>
  );
}
