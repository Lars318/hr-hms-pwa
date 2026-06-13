import { cn } from "@/lib/utils";
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/lib/risk";
import type { RiskLevel } from "@prisma/client";

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", RISK_LEVEL_COLORS[level])}>
      {RISK_LEVEL_LABELS[level]}
    </span>
  );
}
