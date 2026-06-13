import { cn } from "@/lib/utils";
import { ACTION_STATUS_LABELS, ACTION_STATUS_COLORS } from "@/lib/risk";
import type { ActionStatus } from "@prisma/client";

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ACTION_STATUS_COLORS[status])}>
      {ACTION_STATUS_LABELS[status]}
    </span>
  );
}
