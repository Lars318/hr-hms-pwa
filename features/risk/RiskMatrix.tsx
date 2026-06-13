"use client";

import { cn } from "@/lib/utils";
import { calcRiskLevel } from "@/lib/risk";
import { RISK_LEVEL_COLORS } from "@/lib/risk";

interface RiskMatrixProps {
  likelihood?: number;
  impact?: number;
}

function cellColor(l: number, i: number) {
  const score = l * i;
  if (score <= 4) return "bg-green-200";
  if (score <= 9) return "bg-yellow-200";
  if (score <= 16) return "bg-orange-300";
  return "bg-red-400";
}

export function RiskMatrix({ likelihood, impact }: RiskMatrixProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Risikomatrise (sannsynlighet × konsekvens)</p>
      <div className="inline-block">
        {/* Y-axis label */}
        <div className="flex items-end gap-1">
          <div className="flex flex-col items-center gap-1 mr-1">
            <span className="text-[10px] text-muted-foreground rotate-[-90deg] w-5 text-center" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Sannsynlighet</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex gap-0.5 items-center">
                <span className="text-[10px] w-3 text-right text-muted-foreground">{l}</span>
                {[1, 2, 3, 4, 5].map((i) => {
                  const isActive = l === likelihood && i === impact;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-8 w-8 rounded-sm flex items-center justify-center text-[10px] font-bold transition-all",
                        cellColor(l, i),
                        isActive && "ring-2 ring-offset-1 ring-gray-900 scale-110"
                      )}
                    >
                      {l * i}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* X-axis */}
            <div className="flex gap-0.5 mt-0.5 ml-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-8 flex items-center justify-center text-[10px] text-muted-foreground">{i}</div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground ml-4 text-center">Konsekvens</div>
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="flex gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-green-200 inline-block" /> Lav (1–4)</div>
        <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-200 inline-block" /> Middels (5–9)</div>
        <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-orange-300 inline-block" /> Høy (10–16)</div>
        <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-400 inline-block" /> Kritisk (17–25)</div>
      </div>
    </div>
  );
}
