"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, ChevronRight, ListChecks, Plus,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Fagmodul } from "./sjekklister";

const STATUS_META = {
  OK:              { label: "OK",              color: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle2,   dot: "bg-green-500" },
  FORFALLER_SNART: { label: "Forfaller snart", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock,         dot: "bg-yellow-500" },
  FORFALT:         { label: "Forfalt",         color: "bg-red-100 text-red-700 border-red-200",          icon: XCircle,       dot: "bg-red-500" },
  IKKE_SATT:       { label: "Ikke registrert", color: "bg-muted text-muted-foreground border-border",    icon: AlertTriangle, dot: "bg-muted-foreground" },
} as const;

export function FagmodulView({ modul, canEdit }: { modul: Fagmodul; canEdit: boolean }) {
  const { data: omrader, isLoading } = trpc.internkontroll.listeOmrader.useQuery({
    kategori: modul.kategori,
  });

  const teller = { OK: 0, FORFALLER_SNART: 0, FORFALT: 0, IKKE_SATT: 0 };
  (omrader ?? []).forEach((o) => {
    teller[o.status]++;
  });

  const nyHref = `/internkontroll/ny?kategori=${modul.kategori}`;

  return (
    <div className="space-y-6">
      {/* Statusoppsummering */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "OK", value: teller.OK, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { label: "Forfaller snart", value: teller.FORFALLER_SNART, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
          { label: "Forfalt", value: teller.FORFALT, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "Ikke registrert", value: teller.IKKE_SATT, color: "text-muted-foreground", bg: "bg-muted/30 border-border" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3 text-center", bg)}>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Områder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Kontrollområder</h2>
          {canEdit && (
            <Link href={nyHref} className="text-sm text-primary hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Nytt område
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl border bg-muted/40 h-28 animate-pulse" />
            ))}
          </div>
        ) : !omrader?.length ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <p className="font-medium">Ingen {modul.navn.toLowerCase()}-områder registrert</p>
            <p className="text-sm text-muted-foreground">{modul.beskrivelse}</p>
            {canEdit && (
              <Link
                href={nyHref}
                className="inline-flex mt-2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Legg til område
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {omrader.map((o) => {
              const sm = STATUS_META[o.status];
              const StatusIcon = sm.icon;
              return (
                <Link
                  key={o.id}
                  href={`/internkontroll/${o.id}`}
                  className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow active:scale-[0.99] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight">{o.tittel}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium w-fit", sm.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {sm.label}
                  </div>
                  {o.sisteLogg && (
                    <p className="text-xs text-muted-foreground">
                      Sist: {format(new Date(o.sisteLogg.utfortDato), "d. MMM yyyy", { locale: nb })}
                      {o.dagerTilFrist !== null && (
                        <> · {o.dagerTilFrist < 0 ? `forfalt for ${Math.abs(o.dagerTilFrist)} dager siden` : `neste om ${o.dagerTilFrist} dager`}</>
                      )}
                    </p>
                  )}
                  {o.ansvarlig && <p className="text-xs text-muted-foreground">Ansvarlig: {o.ansvarlig.fullName}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Standard sjekkliste for modulen */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <ListChecks className="h-4 w-4" /> Standard sjekkliste
        </h2>
        <div className="rounded-2xl border bg-card divide-y">
          {modul.punkter.map((p) => (
            <div key={p.id} className="px-4 py-2.5">
              <p className="text-sm font-medium leading-snug">{p.label}</p>
              {p.hjelp && <p className="text-xs text-muted-foreground mt-0.5">{p.hjelp}</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Sjekklisten fylles ut når du registrerer en kontroll på et område i denne modulen.
        </p>
      </div>
    </div>
  );
}
