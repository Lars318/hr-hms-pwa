"use client";

import Link from "next/link";
import { ShieldAlert, CalendarDays, Users, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import type { Role } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

type LeaveRow = inferRouterOutputs<AppRouter>["leaveRequest"]["list"][number] & {
  employee: { id: string; fullName: string; email: string };
  department: { id: string; name: string } | null;
};
type IncidentRow = inferRouterOutputs<AppRouter>["incident"]["list"][number];

interface Props {
  role: Role;
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div
      className={`rounded-2xl border bg-card p-4 space-y-2 ${highlight ? "border-primary/40" : ""}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function PendingLeaveApprovals() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.leaveRequest.list.useQuery({ status: "PENDING" });

  const approve = trpc.leaveRequest.approve.useMutation({
    onSuccess: () => utils.leaveRequest.list.invalidate(),
  });
  const reject = trpc.leaveRequest.reject.useMutation({
    onSuccess: () => utils.leaveRequest.list.invalidate(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-3 h-16 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top3 = ((data ?? []) as any[]).slice(0, 3) as LeaveRow[];

  if (top3.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1">Ingen ventende fraværssøknader.</p>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    VACATION: "Ferie",
    SICK_LEAVE: "Sykefravær",
    CARE_LEAVE: "Omsorgsfravær",
    EGENMELDING: "Egenmelding",
    PARENTAL_LEAVE: "Foreldrepermisjon",
    UNPAID_LEAVE: "Ulønnet permisjon",
    OTHER: "Annet",
  };

  return (
    <div className="space-y-2">
      {top3.map((req) => (
        <div key={req.id} className="rounded-2xl border bg-card p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{req.employee.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABELS[req.type] ?? req.type} ·{" "}
              {new Date(req.startDate).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(req.endDate).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
              {" · "}
              {req.days} dag{req.days !== 1 ? "er" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => approve.mutate({ id: req.id })}
              disabled={approve.isPending || reject.isPending}
              className="rounded-xl bg-primary/10 text-primary p-1.5 hover:bg-primary/20 transition-colors disabled:opacity-50"
              title="Godkjenn"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => reject.mutate({ id: req.id })}
              disabled={approve.isPending || reject.isPending}
              className="rounded-xl bg-destructive/10 text-destructive p-1.5 hover:bg-destructive/20 transition-colors disabled:opacity-50"
              title="Avslå"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {(data ?? []).length > 3 && (
        <Link
          href="/fravaer"
          className="block text-xs text-primary hover:underline px-1 pt-1"
        >
          + {(data ?? []).length - 3} til – se alle
        </Link>
      )}
    </div>
  );
}

function OpenIncidentsPreview() {
  const { data, isLoading } = trpc.incident.list.useQuery({ status: "OPEN" });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-3 h-14 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top3 = ((data ?? []) as any[]).slice(0, 3) as IncidentRow[];

  if (top3.length === 0) {
    return <p className="text-sm text-muted-foreground px-1">Ingen åpne avvik.</p>;
  }

  const SEVERITY_COLORS: Record<string, string> = {
    LOW: "bg-muted text-muted-foreground",
    MEDIUM: "bg-primary/10 text-primary",
    HIGH: "bg-amber-100 text-amber-800",
    CRITICAL: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-2">
      {top3.map((inc) => (
        <Link
          key={inc.id}
          href={`/avvik/${inc.id}`}
          className="rounded-2xl border bg-card p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors block"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{inc.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {inc.department?.name ?? "Ukjent avdeling"}
            </p>
          </div>
          <span
            className={`rounded-xl px-2 py-0.5 text-xs font-medium shrink-0 ${
              SEVERITY_COLORS[inc.severity] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {inc.severity}
          </span>
        </Link>
      ))}
      <Link href="/avvik" className="block text-xs text-primary hover:underline px-1 pt-1">
        Se alle avvik →
      </Link>
    </div>
  );
}

function StatsRow() {
  const { data: pending } = trpc.leaveRequest.list.useQuery({ status: "PENDING" });
  const { data: openIncidents } = trpc.incident.list.useQuery({ status: "OPEN" });
  const { data: profiles } = trpc.profile.list.useQuery({});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Fravær til godkjenning"
        value={pending?.length ?? "–"}
        icon={CalendarDays}
        href="/fravaer"
        highlight={(pending?.length ?? 0) > 0}
      />
      <StatCard
        label="Åpne avvik"
        value={openIncidents?.length ?? "–"}
        icon={ShieldAlert}
        href="/avvik"
        highlight={(openIncidents?.length ?? 0) > 0}
      />
      <StatCard
        label="Team aktive"
        value={profiles?.length ?? "–"}
        icon={Users}
        href="/ansatte"
      />
    </div>
  );
}

export function NewManagerDashboard({ role }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats-kort øverst */}
      <StatsRow />

      {/* Tocolumns: ventende godkjenninger + avvik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Ventende godkjenninger</h2>
            <Link href="/fravaer" className="text-xs text-primary hover:underline">
              Se alle
            </Link>
          </div>
          <PendingLeaveApprovals />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Åpne avvik</h2>
            <Link href="/avvik" className="text-xs text-primary hover:underline">
              Se alle
            </Link>
          </div>
          <OpenIncidentsPreview />
        </section>
      </div>
    </div>
  );
}
