"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

const MND = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];

const STATUS_DOT: Record<string, string> = {
  OK: "bg-green-500",
  FORFALLER_SNART: "bg-yellow-500",
  FORFALT: "bg-red-500",
  IKKE_SATT: "bg-muted-foreground",
};

const STATUS_CHIP: Record<string, string> = {
  OK: "bg-green-50 text-green-700 border-green-200",
  FORFALLER_SNART: "bg-yellow-50 text-yellow-700 border-yellow-200",
  FORFALT: "bg-red-50 text-red-700 border-red-200",
  IKKE_SATT: "bg-muted/40 text-muted-foreground border-border",
};

export function InternkontrollAarshjul() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: omrader, isLoading } = trpc.internkontroll.listeOmrader.useQuery();

  if (isLoading) {
    return <div className="rounded-2xl border bg-muted/40 h-64 animate-pulse" />;
  }

  const alle = omrader ?? [];

  // Forfalte (frist passert) — vises som eget varsel uavhengig av valgt år.
  const forfalte = alle.filter((o) => o.status === "FORFALT");

  // Grupper områder etter måneden neste frist faller i (for valgt år).
  const perMnd: Record<number, typeof alle> = {};
  for (let m = 0; m < 12; m++) perMnd[m] = [];
  for (const o of alle) {
    const frist = o.sisteLogg?.nesteFrist;
    if (!frist) continue;
    const d = new Date(frist);
    if (d.getFullYear() === year) perMnd[d.getMonth()].push(o);
  }

  const naa = new Date();
  const erInneverende = (m: number) => year === naa.getFullYear() && m === naa.getMonth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Årshjul {year}
        </h2>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setYear((y) => y - 1)} className="rounded p-1 hover:bg-muted transition-colors" aria-label="Forrige år">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="rounded p-1 hover:bg-muted transition-colors" aria-label="Neste år">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Forfalte — alltid synlig øverst */}
      {forfalte.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-red-700 mb-2">
            <AlertTriangle className="h-4 w-4" /> {forfalte.length} forfalt akkurat nå
          </div>
          <div className="flex flex-wrap gap-1.5">
            {forfalte.map((o) => (
              <Link
                key={o.id}
                href={`/internkontroll/${o.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {o.tittel}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 12-måneders rutenett */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MND.map((navn, m) => {
          const items = perMnd[m];
          return (
            <div
              key={m}
              className={cn(
                "rounded-xl border p-3 min-h-[96px] flex flex-col",
                erInneverende(m) ? "border-primary/40 bg-primary/5" : "bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-semibold uppercase tracking-wide", erInneverende(m) ? "text-primary" : "text-muted-foreground")}>
                  {navn}
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">{items.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {items.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/50">—</span>
                ) : (
                  items.map((o) => (
                    <Link
                      key={o.id}
                      href={`/internkontroll/${o.id}`}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[11px] leading-tight hover:opacity-80 transition-opacity",
                        STATUS_CHIP[o.status]
                      )}
                      title={o.tittel}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[o.status])} />
                      <span className="truncate">{o.tittel}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tegnforklaring */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {[
          ["OK", "OK"],
          ["FORFALLER_SNART", "Forfaller snart"],
          ["FORFALT", "Forfalt"],
          ["IKKE_SATT", "Ikke registrert"],
        ].map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[key])} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
