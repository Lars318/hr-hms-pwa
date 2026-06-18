"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, Megaphone } from "lucide-react";
import { DashboardClient } from "./DashboardClient";
import { MyTasksList } from "./MyTasksList";
import { AnnouncementList } from "@/features/announcements/AnnouncementList";
import { AnnouncementForm } from "@/features/announcements/AnnouncementForm";
import { QuickEgenmelding } from "./QuickEgenmelding";
import { NextVacation } from "./NextVacation";
import { LeaveBalanceCards } from "@/features/leave/LeaveBalanceCards";
import type { Role } from "@prisma/client";

const TABS = [
  { id: "hjem",    label: "Hjem",     icon: LayoutDashboard },
  { id: "oppgaver",label: "Oppgaver", icon: CheckSquare },
  { id: "nyheter", label: "Nyheter",  icon: Megaphone },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface PersonalizedDashboardProps {
  viewerRole: Role;
  viewerName: string;
  isHms: boolean;
}

export function PersonalizedDashboard({ viewerRole, viewerName, isHms }: PersonalizedDashboardProps) {
  const [tab, setTab] = useState<TabId>("hjem");
  const canCreateAnnouncement = viewerRole === "ADMIN" || viewerRole === "HR" || viewerRole === "MANAGER";

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Hjem tab */}
      {tab === "hjem" && (
        <div className="space-y-5">
          <QuickEgenmelding />
          <NextVacation />
          <LeaveBalanceCards />
          <DashboardClient viewerRole={viewerRole} viewerName={viewerName} isHms={isHms} />
        </div>
      )}

      {/* Oppgaver tab */}
      {tab === "oppgaver" && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Mine oppgaver</h2>
          <MyTasksList />
        </div>
      )}

      {/* Nyheter tab */}
      {tab === "nyheter" && (
        <div className="space-y-4">
          {canCreateAnnouncement && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">Ny kunngjøring</h3>
              <AnnouncementForm />
            </div>
          )}
          <h2 className="text-base font-semibold">Kunngjøringer</h2>
          <AnnouncementList />
        </div>
      )}
    </div>
  );
}
