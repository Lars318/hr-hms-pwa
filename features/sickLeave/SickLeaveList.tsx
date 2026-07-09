"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { format, differenceInCalendarDays } from "date-fns";
import { nb } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import type { Role } from "@prisma/client";

const STEP_LABELS: Record<string, string> = {
  OPPFOLGING_PLAN: "Oppfølgingsplan",
  DIALOG_MOTE_1: "Dialogmøte 1",
  DIALOG_MOTE_2: "Dialogmøte 2",
  NAV_NOTIFICATION: "NAV-varsel",
};

interface Props { viewerRole: Role }

export function SickLeaveList({ viewerRole }: Props) {
  const { data: cases = [], isLoading } = trpc.sickLeave.list.useQuery({});

  if (isLoading) {
    return <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl border bg-card animate-pulse" />)}</div>;
  }

  if (!cases.length) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Ingen aktive sykefraværssaker.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cases.map((c) => {
        const now = new Date();
        const overdue = c.steps.filter(
          (s) => !s.completedAt && new Date(s.dueDate) < now
        );
        const upcoming = c.steps.filter(
          (s) => !s.completedAt && new Date(s.dueDate) >= now
        );
        const next = upcoming[0];

        return (
          <Link
            key={c.id}
            href={`/sykefravaer/${c.id}`}
            className="block rounded-2xl border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{c.employee.fullName}</span>
                  <Badge variant={c.status === "ACTIVE" ? "secondary" : "outline"} className="text-xs">
                    {c.status === "ACTIVE" ? "Aktiv" : "Lukket"}
                  </Badge>
                  {overdue.length > 0 && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {overdue.length} forfalt
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Fra {format(new Date(c.startDate), "d. MMM yyyy", { locale: nb })}
                  </span>
                  {c.totalDays > 0 && <span>{c.totalDays} dager</span>}
                </div>
                {next && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Neste: <span className="font-medium text-foreground">{STEP_LABELS[next.type]}</span>{" "}
                    – {format(new Date(next.dueDate), "d. MMM", { locale: nb })}
                    {" "}({differenceInCalendarDays(new Date(next.dueDate), now)} dager igjen)
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {c.steps.filter(s => s.completedAt).length}/{c.steps.length} steg
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
