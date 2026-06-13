import { cn } from "@/lib/utils";
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from "@/lib/leave";
import type { LeaveRequestStatus } from "@prisma/client";

export function LeaveRequestStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        LEAVE_STATUS_COLORS[status]
      )}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}
