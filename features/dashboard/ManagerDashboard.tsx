import { ShieldAlert, Zap, CalendarDays, Users, BarChart2, ShieldCheck, Building2 } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { RoleDashboardHeader } from "./RoleDashboardHeader";
import { QuickActionGrid, type QuickAction } from "./QuickActionGrid";
import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";
import { DueActionsCard } from "./DueActionsCard";
import { RecentIncidentsCard } from "./RecentIncidentsCard";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

type Summary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

const quickActions: QuickAction[] = [
  { href: "/fravaer",         label: "Godkjenn fravær",    icon: CalendarDays,  variant: "primary",  description: "Søknader til behandling" },
  { href: "/rapporter",       label: "Se rapporter",        icon: BarChart2,     variant: "default",  description: "Avdeling og oversikt" },
  { href: "/risiko",          label: "Risikovurderinger",   icon: ShieldCheck,   variant: "default",  description: "Risiko i avdelingen" },
];

interface Props {
  name: string;
  data: Summary;
}

export function ManagerDashboard({ name, data }: Props) {
  const { incidents, actions, risk, managerDash } = data;

  return (
    <div className="space-y-6">
      <RoleDashboardHeader
        title="Min avdeling"
        subtitle={`Hei, ${name.split(" ")[0]} – her er statusen for din avdeling`}
        icon={Building2}
        variant="purple"
      />

      <QuickActionGrid actions={quickActions} />

      {/* Avdelingsstatus */}
      <DashboardSection title="Avdelingsstatus" columns={4}>
        <MetricCard
          title="Åpne avvik"
          value={incidents.open}
          href="/avvik"
          icon={ShieldAlert}
          variant={incidents.open > 0 ? "warning" : "default"}
          description="I avdelingen"
        />
        <MetricCard
          title="Kritiske avvik"
          value={incidents.critical}
          href="/avvik"
          icon={ShieldAlert}
          variant={incidents.critical > 0 ? "danger" : "default"}
          description="Krever umiddelbar handling"
        />
        <MetricCard
          title="Fravær til godkjenning"
          value={managerDash?.pendingLeaveInDept ?? 0}
          href="/fravaer"
          icon={CalendarDays}
          variant={(managerDash?.pendingLeaveInDept ?? 0) > 0 ? "warning" : "default"}
          description="Venter på din behandling"
        />
        <MetricCard
          title="Ansatte"
          value={managerDash?.deptEmployeeCount ?? "—"}
          href="/ansatte"
          icon={Users}
          description="Aktive i avdelingen"
        />
      </DashboardSection>

      {/* Tiltak */}
      <DashboardSection title="Tiltak" icon={Zap} href="/tiltak" columns={3}>
        <MetricCard
          title="Åpne tiltak"
          value={actions.open}
          href="/tiltak"
          icon={Zap}
          variant={actions.open > 5 ? "warning" : "default"}
        />
        <MetricCard
          title="Forfalte tiltak"
          value={actions.overdue}
          href="/tiltak"
          variant={actions.overdue > 0 ? "danger" : "default"}
          description="Passert frist"
        />
        <MetricCard
          title="Forfaller innen 7 dager"
          value={actions.dueSoon}
          href="/tiltak"
          variant={actions.dueSoon > 0 ? "warning" : "default"}
        />
        <DueActionsCard
          actions={actions.mine as unknown as Parameters<typeof DueActionsCard>[0]["actions"]}
          title="Mine tiltak"
        />
      </DashboardSection>

      {/* Risiko */}
      <DashboardSection title="Risiko" icon={ShieldCheck} href="/risiko" columns={3}>
        <MetricCard
          title="Aktive vurderinger"
          value={risk.active}
          href="/risiko"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Til revisjon ≤30 dager"
          value={risk.reviewSoon}
          href="/risiko"
          variant={risk.reviewSoon > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Høy/kritiske risikopunkter"
          value={risk.criticalHighItems}
          href="/risiko"
          variant={risk.criticalHighItems > 0 ? "danger" : "default"}
          description="Ubehandlede"
        />
      </DashboardSection>

      {/* Siste avvik */}
      <DashboardSection title="Nylige avvik" icon={ShieldAlert} href="/avvik" columns={3}>
        <RecentIncidentsCard
          incidents={incidents.recent as Parameters<typeof RecentIncidentsCard>[0]["incidents"]}
        />
      </DashboardSection>

      {/* Aktivitetsfeed */}
      <div className="rounded-2xl border bg-card">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-foreground">Siste aktivitet</h2>
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
