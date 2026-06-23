"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_LABELS, formatNOK } from "./labels";
import type { FinancialContractType } from "@prisma/client";

interface Row {
  type: string;
  value: number;
}

const COLORS = [
  "#16a34a", "#2563eb", "#f59e0b", "#dc2626",
  "#7c3aed", "#0891b2", "#db2777", "#64748b",
];

export function ContractTypeDistribution({ data }: { data?: Row[] }) {
  const rows = (data ?? []).filter((r) => r.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);

  // Bygg conic-gradient for donut.
  let acc = 0;
  const stops = rows.map((r, i) => {
    const start = total > 0 ? (acc / total) * 100 : 0;
    acc += r.value;
    const end = total > 0 ? (acc / total) * 100 : 0;
    return `${COLORS[i % COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Kostnadsfordeling per type</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen data ennå.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="relative h-36 w-36 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(${stops.join(", ")})`,
              }}
            >
              <div className="absolute inset-[22%] rounded-full bg-card flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  {rows.length} typer
                </span>
              </div>
            </div>
            <ul className="flex-1 w-full space-y-2">
              {rows.map((r, i) => (
                <li
                  key={r.type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {TYPE_LABELS[r.type as FinancialContractType] ?? r.type}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatNOK(r.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
