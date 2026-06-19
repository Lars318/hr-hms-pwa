"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  X, CheckCircle2, XCircle, CalendarDays, Clock,
  ShieldAlert, ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const SESSION_KEY = "todo_popup_seen";

const LEAVE_TYPE_LABEL: Record<string, string> = {
  VACATION: "Ferie",
  SICK_LEAVE: "Sykefravær",
  CARE_LEAVE: "Omsorgsfravær",
  EGENMELDING: "Egenmelding",
  PARENTAL_LEAVE: "Foreldrepermisjon",
  UNPAID_LEAVE: "Ulønnet permisjon",
  OTHER: "Annet",
};

interface Props {
  role: Role;
}

export function TodoPopup({ role }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  const canManage = role === "ADMIN" || role === "HR" || role === "MANAGER";

  useEffect(() => {
    if (!canManage) return;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [canManage]);

  const leaveQuery = trpc.leaveRequest.list.useQuery(
    { status: "PENDING" },
    { enabled: open }
  );

  const overtimeQuery = trpc.overtime.list.useQuery(
    { status: "SUBMITTED" } as any,
    { enabled: open }
  );

  const approvLeave = trpc.leaveRequest.approve.useMutation({
    onSuccess: (_, vars) => {
      setApprovedIds((s) => new Set(s).add(vars.id));
      leaveQuery.refetch();
    },
  });
  const rejectLeave = trpc.leaveRequest.reject.useMutation({
    onSuccess: (_, vars) => {
      setRejectedIds((s) => new Set(s).add(vars.id));
      leaveQuery.refetch();
    },
  });
  const approveOvertime = trpc.overtime.approve.useMutation({
    onSuccess: (_, vars) => {
      setApprovedIds((s) => new Set(s).add(vars.id));
      overtimeQuery.refetch();
    },
  });
  const rejectOvertime = trpc.overtime.reject.useMutation({
    onSuccess: (_, vars) => {
      setRejectedIds((s) => new Set(s).add(vars.id));
      overtimeQuery.refetch();
    },
  });

  function close() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const pendingLeave = (leaveQuery.data ?? []).filter(
    (r) => !approvedIds.has(r.id) && !rejectedIds.has(r.id)
  );
  const pendingOvertime = (overtimeQuery.data ?? []).filter(
    (r) => !approvedIds.has(r.id) && !rejectedIds.has(r.id)
  );

  const totalPending = pendingLeave.length + pendingOvertime.length;
  const isLoading = leaveQuery.isLoading || overtimeQuery.isLoading;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-base">Til godkjenning</h2>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalPending === 0
                  ? "Ingen ventende oppgaver"
                  : `${totalPending} element${totalPending !== 1 ? "er" : ""} venter`}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
          {isLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Henter oppgaver…</span>
            </div>
          )}

          {!isLoading && totalPending === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium">Alt er i orden!</p>
              <p className="text-xs text-muted-foreground mt-1">Ingen søknader venter på godkjenning.</p>
            </div>
          )}

          {/* Leave requests */}
          {pendingLeave.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Fraværssøknader ({pendingLeave.length})
                </span>
              </div>
              {pendingLeave.map((req) => (
                <LeaveRow
                  key={req.id}
                  req={req}
                  onApprove={() => approvLeave.mutate({ id: req.id })}
                  onReject={() => rejectLeave.mutate({ id: req.id, managerComment: "Avslått" })}
                  approving={approvLeave.isPending && (approvLeave.variables as any)?.id === req.id}
                  rejecting={rejectLeave.isPending && (rejectLeave.variables as any)?.id === req.id}
                />
              ))}
            </div>
          )}

          {/* Overtime */}
          {pendingOvertime.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Overtid ({pendingOvertime.length})
                </span>
              </div>
              {pendingOvertime.map((ot: any) => (
                <OvertimeRow
                  key={ot.id}
                  ot={ot}
                  onApprove={() => approveOvertime.mutate({ id: ot.id })}
                  onReject={() => rejectOvertime.mutate({ id: ot.id, note: "Avslått" })}
                  approving={approveOvertime.isPending && (approveOvertime.variables as any)?.id === ot.id}
                  rejecting={rejectOvertime.isPending && (rejectOvertime.variables as any)?.id === ot.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between gap-3">
          <button
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lukk
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { close(); router.push("/fravaer"); }}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Alle fravær
              <ChevronRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => { close(); router.push("/overtid/godkjenning"); }}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Overtid
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function LeaveRow({
  req, onApprove, onReject, approving, rejecting,
}: {
  req: any;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const start = new Date(req.startDate).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  const end = new Date(req.endDate).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
        <CalendarDays className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{req.employee?.fullName ?? "Ukjent"}</p>
        <p className="text-xs text-muted-foreground">
          {LEAVE_TYPE_LABEL[req.type] ?? req.type} · {start}–{end}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <ActionBtn onClick={onReject} loading={rejecting} variant="reject" title="Avslå" />
        <ActionBtn onClick={onApprove} loading={approving} variant="approve" title="Godkjenn" />
      </div>
    </div>
  );
}

function OvertimeRow({
  ot, onApprove, onReject, approving, rejecting,
}: {
  ot: any;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const date = new Date(ot.date).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 shrink-0">
        <Clock className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{ot.employee?.fullName ?? "Ukjent"}</p>
        <p className="text-xs text-muted-foreground">
          {ot.hours}t overtid · {date}
          {ot.description && ` · ${ot.description}`}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <ActionBtn onClick={onReject} loading={rejecting} variant="reject" title="Avslå" />
        <ActionBtn onClick={onApprove} loading={approving} variant="approve" title="Godkjenn" />
      </div>
    </div>
  );
}

function ActionBtn({
  onClick, loading, variant, title,
}: {
  onClick: () => void;
  loading: boolean;
  variant: "approve" | "reject";
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
        variant === "approve"
          ? "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : variant === "approve" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
    </button>
  );
}
