"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import {
  Users, Mail, ClipboardCheck, ShieldAlert, Calendar, Clock, Check, Loader2,
  Receipt, Award, ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { HomeHeader } from "./HomeHeader";
import { NewsRow } from "./NewsCards";
import { ActivityFeed } from "@/features/dashboard/ActivityFeed";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import type { Role } from "@prisma/client";

const LEAVE_LABEL: Record<string, string> = {
  VACATION: "Ferie", EGENMELDING: "Egenmelding", SICK_LEAVE: "Sykefravær",
  CARE_LEAVE: "Omsorg", PARENTAL_LEAVE: "Foreldreperm.", UNPAID_LEAVE: "Permisjon", OTHER: "Fravær",
};

const nok = (n: number) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr";

export function AdminWebDashboard({ role, fullName, avatarUrl }: {
  role: Role; fullName: string; avatarUrl: string | null;
}) {
  const isAdmin = role === "ADMIN";
  const utils = trpc.useUtils();

  const { data: summary } = trpc.dashboard.summary.useQuery();
  const { data: pendingLeave = [] } = trpc.leaveRequest.list.useQuery({ status: "PENDING" });
  const { data: pendingOvertime = [] } = trpc.overtime.list.useQuery({ status: "SUBMITTED" });
  const { data: contractSummary } = trpc.financialContract.getSummary.useQuery(undefined, { enabled: isAdmin });
  const { data: contractList } = trpc.financialContract.list.useQuery(
    { sortBy: "endDate", sortDir: "asc", pageSize: 4 },
    { enabled: isAdmin },
  );
  const { data: expiringCerts = [] } = trpc.certification.matrix.useQuery({ onlyExpiring: true });

  const approveLeave = trpc.leaveRequest.approve.useMutation({
    onSuccess: () => { utils.leaveRequest.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });
  const approveOvertime = trpc.overtime.approve.useMutation({
    onSuccess: () => { utils.overtime.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });

  const totalActive = summary?.employees?.totalActive ?? 0;
  const notInvited = summary?.employees?.notInvited ?? 0;
  const incidentsOpen = summary?.incidents.open ?? 0;
  const pendingTotal = pendingLeave.length + pendingOvertime.length;
  const unread = summary?.handbook?.unreadCount ?? 0;
  const readPct = totalActive > 0 ? Math.round(((totalActive - unread) / totalActive) * 100) : null;
  const invitedPct = totalActive > 0 ? Math.round(((totalActive - notInvited) / totalActive) * 100) : null;

  return (
    <div className="space-y-4">
      <HomeHeader fullName={fullName} avatarUrl={avatarUrl} />

      {/* Globalt søk */}
      <GlobalSearch role={role} />

      {/* KPI-rad */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Aktive ansatte" value={totalActive} icon={Users} href="/ansatte" />
        <Kpi label="Ikke invitert" value={notInvited} icon={Mail} href="/ansatte?notInvited=1" accent={notInvited > 0} />
        <Kpi label="Til godkjenning" value={pendingTotal} icon={ClipboardCheck} href="/fravaer" />
        <Kpi label="Åpne avvik" value={incidentsOpen} icon={ShieldAlert} href="/avvik" accent={incidentsOpen > 0} />
      </div>

      {/* Kontrakter + organisasjonshelse */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {isAdmin && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Kontrakter</span>
              <Link href="/okonomi/kontrakter" className="text-xs text-primary">Se alle</Link>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-semibold">{contractSummary ? nok(contractSummary.totalMonthlyCost) : "–"}</span>
              <span className="text-xs text-muted-foreground">
                pr. måned{contractSummary ? ` · ${contractSummary.contractCount} aktive` : ""}
              </span>
            </div>
            <div className="divide-y divide-border">
              {(contractList?.items ?? []).slice(0, 3).map((c) => {
                const days = c.endDate ? differenceInCalendarDays(new Date(c.endDate), new Date()) : null;
                const soon = days != null && days <= 60;
                const monthly = c.monthlyAmount ?? (c.annualAmount ? c.annualAmount / 12 : 0);
                return (
                  <Link key={c.id} href={`/okonomi/kontrakter`} className="flex items-center gap-3 py-2.5">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", soon ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")}>
                      <Receipt className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(c.location?.name ?? c.centerName ?? c.supplierName)} · {nok(monthly)}/mnd
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                      soon ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")}>
                      {days != null ? (days < 0 ? "Utløpt" : soon ? `Utløper ${days} d` : "Aktiv") : "Aktiv"}
                    </span>
                  </Link>
                );
              })}
              {contractList && contractList.items.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">Ingen registrerte kontrakter.</p>
              )}
            </div>
          </div>
        )}

        <div className={cn("rounded-2xl border bg-card p-5", !isAdmin && "lg:col-span-2")}>
          <span className="text-sm font-medium">Organisasjonshelse</span>
          <div className="mt-3 space-y-4">
            {readPct != null && <HealthBar label="Håndbok lest" pct={readPct} />}
            {invitedPct != null && <HealthBar label="Invitert" pct={invitedPct} />}
          </div>
        </div>
      </div>

      {/* Godkjenning · aktivitet · varsler */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Til godkjenning */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Til godkjenning</span>
            <Link href="/fravaer" className="text-xs text-primary">Se alle</Link>
          </div>
          {pendingTotal === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Ingenting venter.</p>
          ) : (
            <div className="divide-y divide-border">
              {pendingLeave.slice(0, 3).map((r) => (
                <ApprovalRow key={r.id} icon={Calendar} tint="bg-primary/10 text-primary"
                  title={`${LEAVE_LABEL[r.type] ?? "Fravær"} · ${r.employee.fullName}`}
                  sub={`${r.days} dag${r.days !== 1 ? "er" : ""}`}
                  pending={approveLeave.isPending && approveLeave.variables?.id === r.id}
                  onApprove={() => approveLeave.mutate({ id: r.id })} />
              ))}
              {pendingOvertime.slice(0, 2).map((o) => (
                <ApprovalRow key={o.id} icon={Clock} tint="bg-accent/10 text-accent"
                  title={`Overtid · ${o.employee.fullName}`} sub={`${o.hours} timer`}
                  pending={approveOvertime.isPending && approveOvertime.variables?.id === o.id}
                  onApprove={() => approveOvertime.mutate({ id: o.id })} />
              ))}
            </div>
          )}
        </div>

        {/* Siste aktivitet */}
        <div className="rounded-2xl border bg-card p-4">
          <span className="text-sm font-medium">Siste aktivitet</span>
          <div className="mt-2">
            <ActivityFeed />
          </div>
        </div>

        {/* Varsler + nyheter */}
        <div className="space-y-4">
          {expiringCerts.length > 0 && (
            <Link href="/rapporter/kompetanse" className="block rounded-2xl border border-l-[3px] border-l-accent bg-card p-4">
              <p className="text-sm">{expiringCerts.length} sertifikat{expiringCerts.length !== 1 ? "er" : ""} utløper snart</p>
              <p className="text-xs text-muted-foreground mt-0.5">Se kompetansematrise</p>
            </Link>
          )}
          <NewsRow />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, href, accent }: {
  label: string; value: number; icon: typeof Users; href: string; accent?: boolean;
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
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", tint)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button onClick={onApprove} disabled={pending}
        className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
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
