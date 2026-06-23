"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTH_LABELS, formatNOK } from "./labels";

interface Row {
  monthIndex: number;
  value: number;
}

export function MonthlyCostChart({ data }: { data?: Row[] }) {
  const rows = data ?? [];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Månedlig kostnadsutvikling</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen data ennå.</p>
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
                  style={{ height: `${(r.value / max) * 100}%`, minHeight: "2px" }}
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
