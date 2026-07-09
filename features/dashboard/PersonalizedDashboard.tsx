"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { DashboardClient } from "./DashboardClient";
import { MyTasksList } from "./MyTasksList";
import { AnnouncementCards } from "@/features/announcements/AnnouncementCards";
import { AnnouncementList } from "@/features/announcements/AnnouncementList";
import { AnnouncementForm } from "@/features/announcements/AnnouncementForm";
import { QuickEgenmelding } from "./QuickEgenmelding";
import { DashboardComplianceWidget } from "./DashboardComplianceWidget";
import { NextVacation } from "./NextVacation";
import { LeaveBalanceCards } from "@/features/leave/LeaveBalanceCards";
import type { Role } from "@prisma/client";

const TABS = [
  { id: "hjem",     label: "Hjem",     icon: LayoutDashboard },
  { id: "oppgaver", label: "Oppgaver", icon: CheckSquare },
  { id: "nyheter",  label: "Nyheter",  icon: Megaphone },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface PersonalizedDashboardProps {
  viewerRole: Role;
  viewerName: string;
  isHms: boolean;
  isContractor?: boolean;
}

export function PersonalizedDashboard({ viewerRole, viewerName, isHms, isContractor }: PersonalizedDashboardProps) {
  const [tab, setTab] = useState<TabId>("hjem");
  const canCreateAnnouncement = viewerRole === "ADMIN" || viewerRole === "HR" || viewerRole === "MANAGER";

  // ── Desktop layout (lg+) ──────────────────────────────────────────────────
  const desktopLayout = (
    <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
      {/* Main — 2/3 */}
      <div className="col-span-2 space-y-6">
        {/* Nyheter */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Nyheter</h2>
            {canCreateAnnouncement && (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  const el = document.getElementById("ny-kunngjoring");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Ny kunngjøring
              </button>
            )}
          </div>
          <AnnouncementCards />
        </section>

        {/* Rollebasert innhold */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Oversikt</h2>
          {!isContractor && <LeaveBalanceCards />}
          <div className="mt-4">
            <DashboardComplianceWidget viewerRole={viewerRole} />
          </div>
          <div className="mt-4">
            <DashboardClient viewerRole={viewerRole} viewerName={viewerName} isHms={isHms} />
          </div>
        </section>

        {/* Opprett kunngjøring (HR/Admin/Manager) */}
        {canCreateAnnouncement && (
          <section id="ny-kunngjoring" className="rounded-2xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Ny kunngjøring</h3>
            <AnnouncementForm />
          </section>
        )}
      </div>

      {/* Sidebar — 1/3 */}
      <div className="space-y-5">
        {!isContractor && (
          <>
            <QuickEgenmelding />
            <NextVacation />
          </>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Mine oppgaver</h2>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Se alle</Link>
          </div>
          <MyTasksList />
        </section>
      </div>
    </div>
  );

  // ── Mobile layout (tabs) ──────────────────────────────────────────────────
  const mobileLayout = (
    <div className="lg:hidden space-y-4">
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

      {tab === "hjem" && (
        <div className="space-y-5">
          {!isContractor && (
            <>
              <QuickEgenmelding />
              <NextVacation />
              <LeaveBalanceCards />
            </>
          )}
          <DashboardComplianceWidget viewerRole={viewerRole} />
          <DashboardClient viewerRole={viewerRole} viewerName={viewerName} isHms={isHms} />
        </div>
      )}

      {tab === "oppgaver" && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Mine oppgaver</h2>
          <MyTasksList />
        </div>
      )}

      {tab === "nyheter" && (
        <div className="space-y-4">
          {canCreateAnnouncement && (
            <div className="rounded-2xl border bg-card p-4 space-y-3">
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

  return (
    <>
      {desktopLayout}
      {mobileLayout}
    </>
  );
}
