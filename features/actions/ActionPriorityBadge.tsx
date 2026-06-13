import { cn } from "@/lib/utils";
import { ACTION_PRIORITY_LABELS, ACTION_PRIORITY_COLORS } from "@/lib/risk";
import type { ActionPriority } from "@prisma/client";

export function ActionPriorityBadge({ priority }: { priority: ActionPriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ACTION_PRIORITY_COLORS[priority])}>
      {ACTION_PRIORITY_LABELS[priority]}
    </span>
  );
}
