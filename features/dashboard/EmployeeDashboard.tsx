import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { ProfileCard }             from "./employee/ProfileCard";
import { EmployeeQuickActions }    from "./employee/EmployeeQuickActions";
import { SummaryStrip }            from "./employee/SummaryStrip";
import { TodoSection }             from "./employee/TodoSection";
import { RecentItemsSection }      from "./employee/RecentItemsSection";
import { DocumentsHandbookSection } from "./employee/DocumentsHandbookSection";
import { BelongingSection }        from "./employee/BelongingSection";

type Summary = inferRouterOutputs<AppRouter>["dashboard"]["summary"];

interface Props {
  data: Summary;
}

export function EmployeeDashboard({ data }: Props) {
  const { employeeProfileHome, handbook } = data;

  // Fallback: hvis employeeProfileHome ikke er lastet ennå
  if (!employeeProfileHome) return null;

  const {
    profile, department, counts, handbookStatus,
    todoItems, recentIncidents, recentActions, recentLeave, unconfirmedDocs,
  } = employeeProfileHome;

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Profilkort */}
      <ProfileCard
        fullName={profile.fullName}
        email={profile.email}
        phone={profile.phone}
        title={profile.title}
        avatarUrl={profile.avatarUrl}
        department={department}
        employedAt={profile.employedAt}
        role="EMPLOYEE"
      />

      {/* 2. Snarveier */}
      <EmployeeQuickActions />

      {/* 3. Status-strip */}
      <SummaryStrip
        openActions={counts.openActions}
        openIncidents={counts.openIncidents}
        pendingLeave={counts.pendingLeave}
        unconfirmedDocs={counts.unconfirmedDocs}
        handbookStatus={handbookStatus}
      />

      {/* 4. Må gjøres */}
      <TodoSection items={todoItems as Parameters<typeof TodoSection>[0]["items"]} />

      {/* 5. Siste saker */}
      <RecentItemsSection
        incidents={recentIncidents as unknown as Parameters<typeof RecentItemsSection>[0]["incidents"]}
        actions={recentActions as unknown as Parameters<typeof RecentItemsSection>[0]["actions"]}
        leave={recentLeave as unknown as Parameters<typeof RecentItemsSection>[0]["leave"]}
      />

      {/* 6. Dokumenter og håndbok */}
      <DocumentsHandbookSection
        unconfirmedDocs={unconfirmedDocs as Parameters<typeof DocumentsHandbookSection>[0]["unconfirmedDocs"]}
        handbookStatus={handbookStatus}
      />

      {/* 7. Tilhørighet */}
      <BelongingSection
        department={department}
        role="EMPLOYEE"
        title={profile.title}
      />
    </div>
  );
}
