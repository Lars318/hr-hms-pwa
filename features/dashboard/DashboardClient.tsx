"use client";

import { trpc } from "@/lib/trpc/client";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { HrDashboard } from "./HrDashboard";
import { HmsDashboard } from "./HmsDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { PersonalizedDashboard } from "./PersonalizedDashboard";
import type { Role } from "@prisma/client";

interface DashboardClientProps {
  viewerRole: Role;
  viewerName: string;
  isHms: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-[88px] rounded-2xl bg-muted" />)}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => <div key={j} className="h-24 rounded-2xl bg-muted" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardClient({ viewerRole, viewerName, isHms }: DashboardClientProps) {
  const { data, isLoading } = trpc.dashboard.summary.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  if (isLoading || !data) return <LoadingSkeleton />;

  if (viewerRole === "EMPLOYEE") {
    return <EmployeeDashboard data={data} />;
  }

  if (viewerRole === "MANAGER") {
    return <ManagerDashboard name={viewerName} data={data} />;
  }

  if (viewerRole === "HR" && isHms) {
    return <HmsDashboard name={viewerName} data={data} />;
  }

  if (viewerRole === "HR") {
    return <HrDashboard name={viewerName} data={data} />;
  }

  if (viewerRole === "ADMIN") {
    return <AdminDashboard name={viewerName} data={data} />;
  }

  return null;
}
