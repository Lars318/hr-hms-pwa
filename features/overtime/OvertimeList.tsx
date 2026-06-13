"use client";

import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const OVERTIME_TYPE_LABELS: Record<string, string> = {
  OVERTIME: "Overtid",
  TIME_OFF: "Avspasering",
  ON_CALL: "Beredskapsvakt",
  TRAVEL_TIME: "Reisetid",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Til godkjenning",
  APPROVED: "Godkjent",
  REJECTED: "Avslått",
  CANCELLED: "Kansellert",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-muted text-muted-foreground",
};

interface OvertimeListProps {
  role: string;
}

export function OvertimeList({ role }: OvertimeListProps) {
  const { data: balance } = trpc.overtime.myBalance.useQuery(undefined, { staleTime: 30_000 });
  const { data: entries = [], isLoading } = trpc.overtime.myEntries.useQuery(undefined, { staleTime: 30_000 });

  return (
    <div className="space-y-6">
      {/* Timebanksaldo */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Saldo", value: `${balance.balanceHours > 0 ? "+" : ""}${balance.balanceHours}t`, highlight: balance.balanceHours >= 0 },
            { label: "Opptjent", value: `${balance.earnedHours}t`, highlight: true },
            { label: "Brukt", value: `${balance.usedHours}t`, highlight: false },
            { label: "Korrigeringer", value: `${balance.adjustmentHours > 0 ? "+" : ""}${balance.adjustmentHours}t`, highlight: balance.adjustmentHours >= 0 },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-2xl border bg-card px-4 py-3 text-center">
              <p className={`text-xl font-bold ${highlight ? "text-green-600" : "text-muted-foreground"}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mine registreringer</h2>
        <div className="rounded-2xl border bg-card divide-y">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Laster…</div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Ingen registreringer ennå.
            </div>
          ) : (
            entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/overtid/${entry.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[56px]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {OVERTIME_TYPE_LABELS[entry.type] ?? entry.type} – {entry.hours}t
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.date), "d. MMM yyyy", { locale: nb })}
                    {entry.location ? ` · ${entry.location.name}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status] ?? ""}`}>
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
