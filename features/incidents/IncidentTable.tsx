"use client";

import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { IncidentStatusBadge } from "@/components/shared/IncidentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import type { Incident, Profile, Department } from "@prisma/client";

type IncidentRow = Incident & {
  reportedBy: Pick<Profile, "id" | "fullName" | "email">;
  assignedTo: Pick<Profile, "id" | "fullName" | "email"> | null;
  department: Pick<Department, "id" | "name"> | null;
};

interface IncidentTableProps {
  incidents: IncidentRow[];
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Ingen avvik funnet"
        description="Prøv å endre søk eller filter, eller opprett et nytt avvik."
      />
    );
  }

  return (
    <>
      {/* ── Mobil: ikonbaserte listekort ─────────────────────────────── */}
      <div className="md:hidden rounded-2xl border bg-card divide-y divide-border">
        {incidents.map((inc) => {
          const sevIcon = {
            CRITICAL: { bg: "bg-red-100", text: "text-red-700",    icon: "🔴" },
            HIGH:     { bg: "bg-red-50",  text: "text-red-600",    icon: "🟠" },
            MEDIUM:   { bg: "bg-amber-50",text: "text-amber-700",  icon: "🟡" },
            LOW:      { bg: "bg-muted",   text: "text-muted-foreground", icon: "⚪" },
          }[inc.severity] ?? { bg: "bg-muted", text: "text-muted-foreground", icon: "⚪" };

          const sevLabel = { CRITICAL: "Kritisk", HIGH: "Høy", MEDIUM: "Middels", LOW: "Lav" }[inc.severity] ?? inc.severity;
          const statusLabel = { OPEN: "Åpen", IN_PROGRESS: "Pågår", RESOLVED: "Lukket", CLOSED: "Arkivert" }[inc.status] ?? inc.status;
          const statusStyle = {
            OPEN:        "bg-red-50 text-red-700",
            IN_PROGRESS: "bg-blue-50 text-blue-700",
            RESOLVED:    "bg-green-50 text-green-700",
            CLOSED:      "bg-muted text-muted-foreground",
          }[inc.status] ?? "bg-muted text-muted-foreground";

          const ageDays = Math.floor((Date.now() - new Date(inc.createdAt).getTime()) / 86_400_000);

          return (
            <Link key={inc.id} href={`/avvik/${inc.id}`} className="flex items-start gap-3 px-4 py-3 active:bg-muted/40 transition-colors">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${sevIcon.bg}`}>
                <ShieldAlert className={`h-4 w-4 ${sevIcon.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{inc.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {inc.department?.name ?? "—"} · {ageDays === 0 ? "i dag" : `${ageDays} dag${ageDays !== 1 ? "er" : ""} siden`}
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sevIcon.bg} ${sevIcon.text}`}>{sevLabel}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>{statusLabel}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
            </Link>
          );
        })}
      </div>

      {/* ── Desktop: tabell ──────────────────────────────────────────── */}
      <div className="hidden md:block rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tittel</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alvorlighetsgrad</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Avdeling</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Rapportert av</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Dato</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium line-clamp-1">{inc.title}</span>
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className="px-4 py-3">
                  <IncidentStatusBadge status={inc.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {inc.department?.name ?? <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {inc.reportedBy.fullName}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {format(new Date(inc.occurredAt), "d. MMM yyyy", { locale: nb })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/avvik/${inc.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Vis avvik</span>
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
