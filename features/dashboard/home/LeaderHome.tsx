"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import {
  Users, Mail, Calendar, Clock, ChevronRight, Award, ShieldAlert, Check, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { HomeHeader } from "./HomeHeader";
import { AnnouncementCard, NewsRow } from "./NewsCards";
import type { Role } from "@prisma/client";

const LEAVE_LABEL: Record<string, string> = {
  VACATION: "Ferie",
  EGENMELDING: "Egenmelding",
  SICK_LEAVE: "Sykefravær",
  CARE_LEAVE: "Omsorg",
  PARENTAL_LEAVE: "Foreldreperm.",
  UNPAID_LEAVE: "Permisjon",
  OTHER: "Fravær",
};

export function LeaderHome({ role, fullName, avatarUrl }: {
  role: Role; fullName: string; avatarUrl: string | null;
}) {
  const isHrAdmin = role === "ADMIN" || role === "HR";
  const canApproveOvertime = role === "ADMIN" || role === "MANAGER";

  const utils = trpc.useUtils();
  const { data: summary } = trpc.dashboard.summary.useQuery();
  const { data: pendingLeave = [] } = trpc.leaveRequest.list.useQuery({ status: "PENDING" });
  const { data: pendingOvertime = [] } = trpc.overtime.list.useQuery(
    { status: "SUBMITTED" },
    { enabled: canApproveOvertime },
  );
  const { data: expiringCerts = [] } = trpc.certification.matrix.useQuery(
    { onlyExpiring: true },
    { enabled: isHrAdmin },
  );

  const approveLeave = trpc.leaveRequest.approve.useMutation({
    onSuccess: () => { utils.leaveRequest.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });
  const approveOvertime = trpc.overtime.approve.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });

  const leaveCount = pendingLeave.length;
  const overtimeCount = canApproveOvertime ? pendingOvertime.length : 0;
  const incidentsOpen = summary?.incidents.open ?? 0;
  const pendingTotal = leaveCount + overtimeCount;

  const inboxHref =
    leaveCount > 0 ? "/fravaer"
    : overtimeCount > 0 ? "/overtid/godkjenning"
    : incidentsOpen > 0 ? "/avvik"
    : "/dashboard";

  const totalActive = summary?.employees?.totalActive ?? null;
  const notInvited = summary?.employees?.notInvited ?? null;
  const deptCount = summary?.managerDash?.deptEmployeeCount ?? null;
  const unread = summary?.handbook?.unreadCount ?? 0;
  const readPct = totalActive && totalActive > 0 ? Math.round(((totalActive - unread) / totalActive) * 100) : null;
  const invitedPct = totalActive && totalActive > 0 && notInvited != null
    ? Math.round(((totalActive - notInvited) / totalActive) * 100) : null;

  return (
    <div className="space-y-5 pb-4">
      <HomeHeader fullName={fullName} avatarUrl={avatarUrl} />

      {/* Fokuskort — det som krever handling */}
      {pendingTotal + incidentsOpen > 0 ? (
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-xs opacity-75">Krever handling</p>
          <p className="mt-1.5 text-lg font-semibold leading-snug">
            {pendingTotal > 0 && `${pendingTotal} godkjenning${pendingTotal !== 1 ? "er" : ""}`}
            {pendingTotal > 0 && incidentsOpen > 0 && " og "}
            {incidentsOpen > 0 && `${incidentsOpen} åpne avvik`}
            {" venter"}
          </p>
          <div className="mt-4 flex gap-2.5">
            <Link href={inboxHref} className="rounded-xl bg-white/95 px-4 py-2 text-sm font-medium text-primary">
              Gå til innboks
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-xs opacity-75">I dag</p>
          <p className="mt-1.5 text-lg font-semibold leading-snug">Alt er i rute</p>
          <p className="mt-1 text-sm opacity-80">Ingen godkjenninger venter akkurat nå.</p>
        </div>
      )}

      {/* Fersk kunngjøring (kun hvis nylig) */}
      <AnnouncementCard />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Venstre kolonne */}
        <div className="space-y-5">
          {/* Nøkkeltall */}
          <div className="grid grid-cols-2 gap-3">
            {isHrAdmin ? (
              <>
                <MetricCard label="Aktive ansatte" value={totalActive ?? "–"} icon={Users} href="/ansatte" />
                <MetricCard label="Ikke invitert" value={notInvited ?? "–"} icon={Mail} href="/ansatte?notInvited=1" accent={(notInvited ?? 0) > 0} />
              </>
            ) : (
              <>
                <MetricCard label="Ansatte i avdeling" value={deptCount ?? "–"} icon={Users} href="/kollegaer" />
                <MetricCard label="Åpne avvik" value={incidentsOpen} icon={ShieldAlert} href="/avvik" accent={incidentsOpen > 0} />
              </>
            )}
          </div>

          {/* Til godkjenning */}
          {pendingTotal > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium">Til godkjenning</span>
                <Link href={inboxHref} className="text-xs text-primary">Se alle</Link>
              </div>
              <div className="rounded-2xl border bg-card divide-y divide-border">
                {pendingLeave.slice(0, 3).map((r) => (
                  <ApprovalRow
                    key={r.id}
                    icon={Calendar}
                    tint="bg-primary/10 text-primary"
                    title={`${LEAVE_LABEL[r.type] ?? "Fravær"} · ${r.employee.fullName}`}
                    sub={`${r.days} dag${r.days !== 1 ? "er" : ""}`}
                    pending={approveLeave.isPending && approveLeave.variables?.id === r.id}
                    onApprove={() => approveLeave.mutate({ id: r.id })}
                  />
                ))}
                {canApproveOvertime && pendingOvertime.slice(0, 3).map((o) => (
                  <ApprovalRow
                    key={o.id}
                    icon={Clock}
                    tint="bg-accent/10 text-accent"
                    title={`Overtid · ${o.employee.fullName}`}
                    sub={`${o.hours} timer`}
                    pending={approveOvertime.isPending && approveOvertime.variables?.id === o.id}
                    onApprove={() => approveOvertime.mutate({ id: o.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Høyre kolonne */}
        <div className="space-y-5">
          {/* Organisasjonshelse (kun HR/admin) */}
          {isHrAdmin && (readPct != null || invitedPct != null) && (
            <div>
              <span className="text-sm font-medium px-1">Organisasjonshelse</span>
              <div className="mt-2 rounded-2xl border bg-card p-4 space-y-4">
                {readPct != null && <HealthBar label="Håndbok lest" pct={readPct} />}
                {invitedPct != null && <HealthBar label="Invitert" pct={invitedPct} />}
              </div>
            </div>
          )}

          {/* Sertifikater utløper */}
          {isHrAdmin && expiringCerts.length > 0 && (
            <Link
              href="/rapporter/kompetanse"
              className="flex items-center gap-3 rounded-2xl border border-l-[3px] border-l-accent bg-card px-4 py-3.5"
            >
              <Award className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{expiringCerts.length} sertifikat{expiringCerts.length !== 1 ? "er" : ""} utløper snart</p>
                <p className="text-xs text-muted-foreground">Se kompetansematrise</p>
              </div>
              <ChevronRight className="h-[18px] w-[18px] text-muted-foreground/50" />
            </Link>
          )}

          <NewsRow />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, href, accent }: {
  label: string; value: number | string; icon: typeof Users; href: string; accent?: boolean;
}) {
  return (
    <Link href={href} className="rounded-2xl border bg-card p-4 block active:scale-[0.99] transition-transform">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-primary")} />
      </div>
      <p className="text-2xl font-semibold leading-none">{value}</p>
    </Link>
  );
}

function ApprovalRow({ icon: Icon, tint, title, sub, pending, onApprove }: {
  icon: typeof Calendar; tint: string; title: string; sub: string; pending: boolean; onApprove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", tint)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button
        onClick={onApprove}
        disabled={pending}
        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Godkjenn
      </button>
    </div>
  );
}

function HealthBar({ label, pct }: { label: string; pct: number }) {
  const low = pct < 80;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", low ? "bg-accent" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
