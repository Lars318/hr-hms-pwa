"use client";

import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";

const OVERTIME_TYPE_LABELS: Record<string, string> = {
  OVERTIME: "Overtid",
  TIME_OFF: "Avspasering",
  ON_CALL: "Beredskapsvakt",
  TRAVEL_TIME: "Reisetid",
};

interface OvertimeApprovalListProps {
  role: string;
  departmentId: string | null;
}

export function OvertimeApprovalList({ role }: OvertimeApprovalListProps) {
  const { success, error: toastError } = useToast();
  const utils = trpc.useUtils();

  const { data: entries = [], isLoading } = trpc.overtime.list.useQuery(
    { status: "SUBMITTED" },
    { staleTime: 30_000 }
  );

  const approveMutation = trpc.overtime.approve.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); success("Godkjent!"); },
    onError: (err) => toastError(err.message),
  });
  const rejectMutation = trpc.overtime.reject.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); success("Avslått."); },
    onError: (err) => toastError(err.message),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Laster…</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Ingen registreringer venter på godkjenning.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card divide-y">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-100">
            <Clock className="h-4 w-4 text-yellow-700" />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/overtid/${entry.id}`} className="hover:underline">
              <p className="text-sm font-medium">
                {entry.employee.fullName} – {OVERTIME_TYPE_LABELS[entry.type] ?? entry.type} {entry.hours}t
              </p>
            </Link>
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.date), "d. MMM yyyy", { locale: nb })}
              {entry.location ? ` · ${entry.location.name}` : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => approveMutation.mutate({ id: entry.id })}
              disabled={approveMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors min-h-[32px]"
            >
              Godkjenn
            </button>
            <button
              onClick={() => {
                const note = window.prompt("Årsak til avslag (påkrevd):");
                if (note) rejectMutation.mutate({ id: entry.id, note });
              }}
              disabled={rejectMutation.isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors min-h-[32px]"
            >
              Avslå
            </button>
            <Link href={`/overtid/${entry.id}`} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
