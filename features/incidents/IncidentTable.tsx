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
      {/* ── Mobil: kortoversikt ──────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {incidents.map((inc) => (
          <Link key={inc.id} href={`/avvik/${inc.id}`} className="block">
            <div className="rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <span className="font-medium line-clamp-2 flex-1 min-w-0">{inc.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <IncidentStatusBadge status={inc.status} />
                <SeverityBadge severity={inc.severity} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground min-w-0">
                <span className="truncate">{inc.department?.name ?? "—"}</span>
                <span className="shrink-0 ml-2">
                  {format(new Date(inc.occurredAt), "d. MMM yyyy", { locale: nb })}
                </span>
              </div>
            </div>
          </Link>
        ))}
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
