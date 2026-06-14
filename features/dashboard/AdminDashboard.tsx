import { Users, Bell, BarChart2, Activity, Settings, Shield, AlertTriangle } from "lucide-react";
import { RoleDashboardHeader } from "./RoleDashboardHeader";
import { QuickActionGrid, type QuickAction } from "./QuickActionGrid";
import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";
import { DepartmentOverviewCard } from "./DepartmentOverviewCard";
import { RecentIncidentsCard } from "./RecentIncidentsCard";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

type Summary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

const quickActions: QuickAction[] = [
  { href: "/admin/system",  label: "Systemstatus",  icon: Activity,   variant: "primary",  description: "Helse og logger" },
  { href: "/ansatte",       label: "Ansatte",        icon: Users,      variant: "default",  description: "Brukere og roller" },
  { href: "/rapporter",     label: "Rapporter",      icon: BarChart2,  variant: "default",  description: "CSV-eksport" },
  { href: "/admin/avdelinger", label: "Avdelinger",  icon: Settings,   variant: "default",  description: "Struktur og oppsett" },
  { href: "/varsling/admin",  label: "Varslingssaker", icon: AlertTriangle, variant: "default", description: "Konfidensiell behandling" },
];

interface Props {
  name: string;
  data: Summary;
}

export function AdminDashboard({ name, data }: Props) {
  const { incidents, employees, handbook, adminDash } = data;

  return (
    <div className="space-y-6">
      <RoleDashboardHeader
        title="Systemoversikt"
        subtitle={`Hei, ${name.split(" ")[0]} – full systemoversikt`}
        icon={Shield}
        variant="default"
      />

      <QuickActionGrid actions={quickActions} />

      {/* Systemstatistikk */}
      <DashboardSection title="Systemstatistikk" columns={4}>
        <MetricCard
          title="Aktive brukere"
          value={employees?.totalActive ?? 0}
          href="/ansatte"
          icon={Users}
          description="Med status ACTIVE"
        />
        <MetricCard
          title="Totalt brukere"
          value={adminDash?.totalUsers ?? 0}
          href="/ansatte"
          icon={Users}
          description="Inkl. inaktive"
        />
        <MetricCard
          title="Varsler siste 30 dager"
          value={adminDash?.notificationsLast30d ?? 0}
          href="/varsler"
          icon={Bell}
          description="In-app + e-post + push"
        />
        <MetricCard
          title="Mangler håndbok-lesing"
          value={handbook.unreadCount}
          href="/personalhandbok/admin"
          variant={handbook.unreadCount > 0 ? "warning" : "success"}
          description="Aktive ansatte"
        />
      </DashboardSection>

      {/* HMS-status */}
      <DashboardSection title="HMS-status" icon={Shield} href="/avvik" columns={3}>
        <MetricCard
          title="Åpne avvik"
          value={incidents.open}
          href="/avvik"
          variant={incidents.open > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Kritiske avvik"
          value={incidents.critical}
          href="/avvik"
          variant={incidents.critical > 0 ? "danger" : "default"}
          description="Krever handling"
        />
        <RecentIncidentsCard
          incidents={incidents.recent as Parameters<typeof RecentIncidentsCard>[0]["incidents"]}
        />
      </DashboardSection>

      {/* Ansatte per avdeling */}
      {employees && (
        <DashboardSection title="Ansatte" icon={Users} href="/ansatte" columns={2}>
          <MetricCard
            title="Avdelinger"
            value={employees.byDepartment.filter((r) => r.departmentId).length}
            description="Med ansatte"
          />
          <DepartmentOverviewCard
            totalActive={employees.totalActive}
            byDepartment={employees.byDepartment as Parameters<typeof DepartmentOverviewCard>[0]["byDepartment"]}
          />
        </DashboardSection>
      )}
    </div>
  );
}
