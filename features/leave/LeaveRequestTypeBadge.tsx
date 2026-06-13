import { cn } from "@/lib/utils";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS } from "@/lib/leave";
import type { LeaveRequestType } from "@prisma/client";

export function LeaveRequestTypeBadge({ type }: { type: LeaveRequestType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        LEAVE_TYPE_COLORS[type]
      )}
    >
      {LEAVE_TYPE_LABELS[type]}
    </span>
  );
}
