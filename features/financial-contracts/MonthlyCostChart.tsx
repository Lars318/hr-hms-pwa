"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { MONTH_LABELS, formatNOK } from "./labels";

const W = 600;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function yTicks(max: number): number[] {
  if (max === 0) return [0];
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.ceil(raw / mag) * mag;
  return [0, step, step * 2, step * 3, step * 4];
}

function fmtK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

export function MonthlyCostChart() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [hovered, setHovered] = useState<number | null>(null);

  const { data: summary } = trpc.financialContract.getSummary.useQuery({ year });
  const rows = summary?.monthlyCostByMonth ?? [];
  const values = rows.map((r) => r.value);
  const dataMax = Math.max(0, ...values);
  const ticks = yTicks(dataMax);
  const axisMax = ticks[ticks.length - 1] ?? 1;

  // Map month index → SVG coordinates
  const pts = rows.map((r, i) => ({
    x: PAD.left + (i / 11) * INNER_W,
    y: PAD.top + INNER_H - (r.value / axisMax) * INNER_H,
    value: r.value,
    monthIndex: r.monthIndex,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = pts.length
    ? `M${pts[0].x},${PAD.top + INNER_H} ` +
      pts.map((p) => `L${p.x},${p.y}`).join(" ") +
      ` L${pts[pts.length - 1].x},${PAD.top + INNER_H} Z`
    : "";

  const hasData = values.some((v) => v > 0);

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
          <span className="w-12 text-center text-sm font-medium tabular-nums">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded p-1 hover:bg-muted transition-colors"
            aria-label="Neste år"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">Ingen data for {year}.</p>
        ) : (
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: H }}
              onMouseLeave={() => setHovered(null)}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" className="text-primary" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                </linearGradient>
              </defs>

              {/* Y-axis grid + labels */}
              {ticks.map((t) => {
                const y = PAD.top + INNER_H - (t / axisMax) * INNER_H;
                return (
                  <g key={t}>
                    <line
                      x1={PAD.left} y1={y} x2={PAD.left + INNER_W} y2={y}
                      stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
                      className="text-foreground"
                    />
                    <text
                      x={PAD.left - 6} y={y + 4}
                      textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.45"
                      className="text-foreground"
                    >
                      {fmtK(t)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {area && (
                <path d={area} fill="url(#areaGrad)" />
              )}

              {/* Line */}
              <polyline
                points={polyline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="text-primary"
              />

              {/* Hover zones + dots */}
              {pts.map((p, i) => (
                <g key={i} onMouseEnter={() => setHovered(i)}>
                  {/* invisible hit area */}
                  <rect
                    x={p.x - INNER_W / 24}
                    y={PAD.top}
                    width={INNER_W / 12}
                    height={INNER_H}
                    fill="transparent"
                  />
                  {/* dot */}
                  <circle
                    cx={p.x} cy={p.y} r={hovered === i ? 5 : 3}
                    fill="currentColor"
                    className="text-primary"
                    style={{ transition: "r 0.1s" }}
                  />
                  {/* X label */}
                  <text
                    x={p.x} y={H - 4}
                    textAnchor="middle" fontSize="10"
                    fill="currentColor" fillOpacity="0.45"
                    className="text-foreground"
                  >
                    {MONTH_LABELS[p.monthIndex]}
                  </text>
                </g>
              ))}

              {/* Tooltip */}
              {hovered !== null && pts[hovered] && (() => {
                const p = pts[hovered];
                const label = formatNOK(p.value);
                const tw = label.length * 7 + 16;
                const tx = Math.min(Math.max(p.x - tw / 2, PAD.left), PAD.left + INNER_W - tw);
                const ty = p.y - 36;
                return (
                  <g>
                    <rect x={tx} y={ty} width={tw} height={22} rx="4"
                      fill="currentColor" className="text-foreground" fillOpacity="0.9" />
                    <text x={tx + tw / 2} y={ty + 14.5}
                      textAnchor="middle" fontSize="11" fontWeight="500"
                      fill="currentColor" className="text-background">
                      {label}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
