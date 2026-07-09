import { Users, CalendarDays, BookOpen, FolderOpen, BarChart2, BookMarked, AlertTriangle, GraduationCap } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { RoleDashboardHeader } from "./RoleDashboardHeader";
import { QuickActionGrid, type QuickAction } from "./QuickActionGrid";
import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";
import { DepartmentOverviewCard } from "./DepartmentOverviewCard";
import { DocumentReadStatusCard } from "./DocumentReadStatusCard";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

type Summary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

const quickActions: QuickAction[] = [
  { href: "/dokumenter/ny",          label: "Nytt dokument",          icon: FolderOpen,   variant: "primary",  description: "Last opp til arkivet" },
  { href: "/personalhandbok/admin",  label: "Håndbok admin",          icon: BookMarked,   variant: "default",  description: "Kapitler og publisering" },
  { href: "/ansatte",                label: "Ansatte",                 icon: Users,        variant: "default",  description: "Profiler og tilganger" },
  { href: "/rapporter",              label: "Rapporter",               icon: BarChart2,    variant: "default",  description: "CSV-eksport og statistikk" },
  { href: "/varsling/admin",        label: "Varslingssaker",          icon: AlertTriangle,  variant: "default", description: "Konfidensielle varsler" },
  { href: "/opplaering/admin",      label: "Opplæringsadmin",         icon: GraduationCap, variant: "default", description: "Gjennomføringer og status" },
];

interface Props {
  name: string;
  data: Summary;
}

export function HrDashboard({ name, data }: Props) {
  const { documents, handbook, employees, hrDash } = data;

  return (
    <div className="space-y-6">
      <RoleDashboardHeader
        title="HR-oversikt"
        subtitle={`Hei, ${name.split(" ")[0]} – her er en oversikt for HR`}
        icon={Users}
        variant="green"
      />

      <QuickActionGrid actions={quickActions} />

      {/* Nøkkeltall */}
      <DashboardSection title="Nøkkeltall" columns={4}>
        <MetricCard
          title="Aktive ansatte"
          value={employees?.totalActive ?? 0}
          href="/ansatte"
          icon={Users}
          description="Totalt i organisasjonen"
        />
        <MetricCard
          title="Fravær til behandling"
          value={hrDash?.pendingLeaveOrgWide ?? 0}
          href="/fravaer"
          icon={CalendarDays}
          variant={(hrDash?.pendingLeaveOrgWide ?? 0) > 0 ? "warning" : "default"}
          description="Venter på godkjenning"
        />
        <MetricCard
          title="Utløpende dokumenter"
          value={documents.expiringSoon}
          href="/dokumenter"
          icon={FolderOpen}
          variant={documents.expiringSoon > 0 ? "warning" : "default"}
          description="Innen 30 dager"
        />
        <MetricCard
          title="Mangler håndbok-lesing"
          value={handbook.unreadCount}
          href="/personalhandbok/admin"
          icon={BookMarked}
          variant={handbook.unreadCount > 0 ? "warning" : "success"}
          description="Aktive ansatte"
        />
        <MetricCard
          title="Ikke invitert ennå"
          value={employees?.notInvited ?? 0}
          href="/ansatte?notInvited=1"
          icon={Users}
          variant={(employees?.notInvited ?? 0) > 0 ? "warning" : "success"}
          description="Aktive uten invitasjon"
        />
      </DashboardSection>

      {/* Dokumenter */}
      <DashboardSection title="Dokumenter" icon={BookOpen} href="/dokumenter" columns={2}>
        <MetricCard
          title="Mine ubekreftede dokumenter"
          value={documents.unconfirmed.length}
          href="/dokumenter"
          variant={documents.unconfirmed.length > 0 ? "warning" : "success"}
          description="Egne lesebekreftelser"
        />
        <MetricCard
          title="Personalhåndbok"
          value={handbook.version !== null ? `v${handbook.version}` : "Ingen versjon"}
          href="/personalhandbok"
          icon={BookMarked}
          variant={handbook.hasRead ? "success" : "warning"}
          description={handbook.hasRead ? "Du har bekreftet lest" : "Bekreft at du har lest"}
        />
        <DocumentReadStatusCard
          expiringSoon={documents.expiringSoon}
          unconfirmed={documents.unconfirmed as Parameters<typeof DocumentReadStatusCard>[0]["unconfirmed"]}
        />
      </DashboardSection>

      {/* Ansatte per avdeling */}
      {employees && (
        <DashboardSection title="Ansatte" icon={Users} href="/ansatte" columns={2}>
          <DepartmentOverviewCard
            totalActive={employees.totalActive}
            byDepartment={employees.byDepartment as Parameters<typeof DepartmentOverviewCard>[0]["byDepartment"]}
          />
        </DashboardSection>
      )}

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
