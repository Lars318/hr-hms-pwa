import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { IncidentStatusBadge } from "@/components/shared/IncidentStatusBadge";
import type { IncidentSeverity, IncidentStatus } from "@prisma/client";

interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: Date;
  reportedBy: { fullName: string };
  department: { name: string } | null;
}

interface RecentIncidentsCardProps {
  incidents: Incident[];
}

export function RecentIncidentsCard({ incidents }: RecentIncidentsCardProps) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-lg border bg-card col-span-full">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Nylig rapporterte avvik</h3>
        </div>
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen åpne avvik</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card col-span-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Nylig rapporterte avvik</h3>
        <Link href="/avvik" className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
      </div>
      <div className="divide-y">
        {incidents.map((inc) => (
          <Link key={inc.id} href={`/avvik/${inc.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{inc.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {inc.reportedBy.fullName}
                {inc.department && ` · ${inc.department.name}`}
                {" · "}
                {format(new Date(inc.createdAt), "d. MMM", { locale: nb })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityBadge severity={inc.severity} />
              <IncidentStatusBadge status={inc.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
