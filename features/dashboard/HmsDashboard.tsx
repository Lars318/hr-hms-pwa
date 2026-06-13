import { ShieldAlert, ShieldCheck, Zap, HardHat } from "lucide-react";
import { RoleDashboardHeader } from "./RoleDashboardHeader";
import { QuickActionGrid, type QuickAction } from "./QuickActionGrid";
import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";
import { RecentIncidentsCard } from "./RecentIncidentsCard";
import { RiskOverviewCard } from "./RiskOverviewCard";
import { DueActionsCard } from "./DueActionsCard";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

type Summary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

const quickActions: QuickAction[] = [
  { href: "/risiko/ny",   label: "Ny risikovurdering", icon: ShieldCheck, variant: "primary",  description: "Start ny vurdering" },
  { href: "/avvik/ny",    label: "Rapporter avvik",    icon: ShieldAlert, variant: "warning",  description: "Meld inn HMS-avvik" },
  { href: "/tiltak",      label: "Tiltak",              icon: Zap,         variant: "default",  description: "Oppfølging og status" },
];

interface Props {
  name: string;
  data: Summary;
}

export function HmsDashboard({ name, data }: Props) {
  const { incidents, actions, risk } = data;

  return (
    <div className="space-y-6">
      <RoleDashboardHeader
        title="HMS-oversikt"
        subtitle={`Hei, ${name.split(" ")[0]} – her er HMS-status for organisasjonen`}
        icon={HardHat}
        variant="orange"
      />

      <QuickActionGrid actions={quickActions} />

      {/* Kritiske indikatorer */}
      <DashboardSection title="Kritiske indikatorer" columns={4}>
        <MetricCard
          title="Kritiske avvik"
          value={incidents.critical}
          href="/avvik"
          icon={ShieldAlert}
          variant={incidents.critical > 0 ? "danger" : "default"}
          description="Ubehandlede"
        />
        <MetricCard
          title="Høy/kritisk risiko"
          value={risk.criticalHighItems}
          href="/risiko"
          icon={ShieldCheck}
          variant={risk.criticalHighItems > 0 ? "danger" : "default"}
          description="Ubehandlede risikopunkter"
        />
        <MetricCard
          title="Forfalte tiltak"
          value={actions.overdue}
          href="/tiltak"
          icon={Zap}
          variant={actions.overdue > 0 ? "danger" : "default"}
          description="Passert frist"
        />
        <MetricCard
          title="Tiltak forfaller snart"
          value={actions.dueSoon}
          href="/tiltak"
          icon={Zap}
          variant={actions.dueSoon > 0 ? "warning" : "default"}
          description="Innen 7 dager"
        />
      </DashboardSection>

      {/* Avvik */}
      <DashboardSection title="Avvik" icon={ShieldAlert} href="/avvik" columns={4}>
        <MetricCard
          title="Åpne avvik"
          value={incidents.open}
          href="/avvik"
          variant={incidents.open > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Under arbeid"
          value={incidents.inProgress}
          href="/avvik"
        />
        <MetricCard
          title="Alvorlighetsgrad"
          value={incidents.bySeverity.map((s) => `${s._count.severity} ${s.severity}`).join(" · ") || "—"}
          description="Åpne per grad"
        />
        <RecentIncidentsCard
          incidents={incidents.recent as Parameters<typeof RecentIncidentsCard>[0]["incidents"]}
        />
      </DashboardSection>

      {/* Risiko */}
      <DashboardSection title="Risikovurderinger" icon={ShieldCheck} href="/risiko" columns={3}>
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
        <RiskOverviewCard
          active={risk.active}
          reviewSoon={risk.reviewSoon}
          criticalHighItems={risk.criticalHighItems}
          topAssessment={risk.topAssessment as Parameters<typeof RiskOverviewCard>[0]["topAssessment"]}
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
        <DueActionsCard
          actions={actions.mine as unknown as Parameters<typeof DueActionsCard>[0]["actions"]}
          title="Mine tiltak"
        />
      </DashboardSection>
    </div>
  );
}
