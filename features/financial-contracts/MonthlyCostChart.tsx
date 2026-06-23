"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { MONTH_LABELS, formatNOK } from "./labels";

export function MonthlyCostChart() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: summary } = trpc.financialContract.getSummary.useQuery({ year });
  const rows = summary?.monthlyCostByMonth ?? [];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Månedlig kostnadsutvikling</CardTitle>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded p-1 hover:bg-muted transition-colors"
            aria-label="Forrige år"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= currentYear}
            className="rounded p-1 hover:bg-muted transition-colors disabled:opacity-30"
            aria-label="Neste år"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.every((r) => r.value === 0) ? (
          <p className="text-sm text-muted-foreground">Ingen data for {year}.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-40">
            {rows.map((r) => (
              <div
                key={r.monthIndex}
                className="flex-1 flex flex-col items-center justify-end gap-1 group"
                title={`${MONTH_LABELS[r.monthIndex]}: ${formatNOK(r.value)}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors"
                  style={{ height: `${(r.value / max) * 100}%`, minHeight: r.value > 0 ? "2px" : "0" }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {MONTH_LABELS[r.monthIndex]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
