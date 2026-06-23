"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { MONTH_LABELS, formatNOK } from "./labels";

const H = 180;
const PAD = { top: 20, right: 8, bottom: 28, left: 4 };

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setW(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: summary } = trpc.financialContract.getSummary.useQuery({ year });
  const rows = summary?.monthlyCostByMonth ?? [];
  const values = rows.map((r) => r.value);
  const dataMax = Math.max(0, ...values);
  const ticks = yTicks(dataMax);
  const axisMax = ticks[ticks.length - 1] ?? 1;
  const hasData = values.some((v) => v > 0);

  // Plot dimensions derived from measured container width
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const pts = rows.map((r, i) => ({
    x: PAD.left + (rows.length > 1 ? (i / (rows.length - 1)) : 0.5) * innerW,
    y: PAD.top + innerH - (axisMax > 0 ? (r.value / axisMax) * innerH : 0),
    value: r.value,
    monthIndex: r.monthIndex,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = pts.length
    ? `M${pts[0].x},${PAD.top + innerH} ` +
      pts.map((p) => `L${p.x},${p.y}`).join(" ") +
      ` L${pts[pts.length - 1].x},${PAD.top + innerH} Z`
    : "";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-base">Månedlig kostnadsutvikling</CardTitle>
        <div className="flex items-center gap-0.5">
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

      <CardContent className="px-0 pb-4 pt-1">
        <div ref={containerRef} className="w-full">
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-4 px-4">Ingen data for {year}.</p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width={W}
            height={H}
            preserveAspectRatio="none"
            className="block"
            style={{ width: "100%", height: H }}
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <linearGradient id="fcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4a7c59" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Y-axis grid + floating labels */}
            {ticks.map((t, ti) => {
              const y = PAD.top + innerH - (t / axisMax) * innerH;
              const isBottom = ti === 0;
              return (
                <g key={t}>
                  <line
                    x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
                    stroke="#00000018" strokeWidth="1"
                  />
                  <text
                    x={PAD.left + 4}
                    y={isBottom ? y - 3 : y + 11}
                    textAnchor="start" fontSize="10" fill="#aaa"
                  >
                    {fmtK(t)}
                  </text>
                </g>
              );
            })}

            {/* Area */}
            {area && <path d={area} fill="url(#fcAreaGrad)" />}

            {/* Line */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#4a7c59"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Dots + hover zones + x-labels */}
            {pts.map((p, i) => (
              <g key={i} onMouseEnter={() => setHovered(i)}>
                <rect
                  x={p.x - innerW / (2 * 12)}
                  y={PAD.top}
                  width={innerW / 12}
                  height={innerH}
                  fill="transparent"
                />
                <circle
                  cx={p.x} cy={p.y}
                  r={hovered === i ? 5.5 : 3.5}
                  fill="#4a7c59"
                  style={{ transition: "r 0.1s" }}
                />
                <text
                  x={p.x} y={H - 4}
                  textAnchor="middle" fontSize="11" fill="#888"
                >
                  {MONTH_LABELS[p.monthIndex]}
                </text>
              </g>
            ))}

            {/* Tooltip */}
            {hovered !== null && pts[hovered] && (() => {
              const p = pts[hovered];
              const label = formatNOK(p.value);
              const tw = label.length * 7.5 + 18;
              const th = 24;
              const tx = Math.min(
                Math.max(p.x - tw / 2, PAD.left),
                PAD.left + innerW - tw
              );
              const ty = Math.max(p.y - th - 8, PAD.top);
              return (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={tx} y={ty} width={tw} height={th} rx="5"
                    fill="#1a2e1f" fillOpacity="0.88"
                  />
                  <text
                    x={tx + tw / 2} y={ty + 15.5}
                    textAnchor="middle" fontSize="12" fontWeight="600"
                    fill="#ffffff"
                  >
                    {label}
                  </text>
                </g>
              );
            })()}
          </svg>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
