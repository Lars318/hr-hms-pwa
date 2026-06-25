"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Receipt, ChevronRight, AlertTriangle, Clock, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Role } from "@prisma/client";

interface Props {
  viewerRole: Role;
}

export function DashboardComplianceWidget({ viewerRole }: Props) {
  const seInternkontroll = ["ADMIN", "HR", "MANAGER"].includes(viewerRole);
  const seKontrakter = viewerRole === "ADMIN";

  const { data: omrader } = trpc.internkontroll.listeOmrader.useQuery(undefined, {
    enabled: seInternkontroll,
  });
  const { data: kontrakter } = trpc.financialContract.list.useQuery(
    { status: "EXPIRES_SOON", sortBy: "endDate", sortDir: "asc", pageSize: 100 },
    { enabled: seKontrakter }
  );

  if (!seInternkontroll && !seKontrakter) return null;

  const forfalt = (omrader ?? []).filter((o) => o.status === "FORFALT");
  const forfaller = (omrader ?? []).filter((o) => o.status === "FORFALLER_SNART");
  const utlopende = kontrakter?.items ?? [];

  const harInternkontrollVarsel = forfalt.length > 0 || forfaller.length > 0;
  const harKontraktVarsel = utlopende.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Forfalte internkontroller */}
      {seInternkontroll && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Internkontroll</h3>
            </div>
            <Link href="/internkontroll" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {!harInternkontrollVarsel ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Alt à jour
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs">
                {forfalt.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-medium">
                    <AlertTriangle className="h-3 w-3" /> {forfalt.length} forfalt
                  </span>
                )}
                {forfaller.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 font-medium">
                    <Clock className="h-3 w-3" /> {forfaller.length} forfaller snart
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {[...forfalt, ...forfaller].slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/internkontroll/${o.id}`}
                      className="flex items-center justify-between gap-2 text-sm hover:bg-muted/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                    >
                      <span className="truncate">{o.tittel}</span>
                      <span className={cn("text-xs shrink-0", o.status === "FORFALT" ? "text-red-600" : "text-yellow-600")}>
                        {o.dagerTilFrist !== null
                          ? o.dagerTilFrist < 0
                            ? `${Math.abs(o.dagerTilFrist)}d forsinket`
                            : `${o.dagerTilFrist}d igjen`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Kontrakter som utløper */}
      {seKontrakter && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Kontrakter som utløper</h3>
            </div>
            <Link href="/okonomi/kontrakter" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {!harKontraktVarsel ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Ingen kontrakter utløper snart
            </div>
          ) : (
            <ul className="space-y-1">
              {utlopende.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href="/okonomi/kontrakter"
                    className="flex items-center justify-between gap-2 text-sm hover:bg-muted/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="truncate">{c.name}</span>
                    {c.endDate && (
                      <span className="text-xs text-orange-600 shrink-0">
                        {format(new Date(c.endDate), "d. MMM", { locale: nb })}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              {utlopende.length > 4 && (
                <li className="text-xs text-muted-foreground px-2 pt-1">
                  +{utlopende.length - 4} til
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
