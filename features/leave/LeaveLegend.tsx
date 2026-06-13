import { LEAVE_TYPE_LABELS, LEAVE_TYPE_CALENDAR_COLORS } from "@/lib/leave";
import type { LeaveRequestType } from "@prisma/client";
import { cn } from "@/lib/utils";

const TYPES: LeaveRequestType[] = [
  "VACATION", "SICK_LEAVE", "CARE_LEAVE",
  "PARENTAL_LEAVE", "UNPAID_LEAVE", "OTHER",
];

export function LeaveLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {TYPES.map((type) => (
        <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", LEAVE_TYPE_CALENDAR_COLORS[type])} />
          {LEAVE_TYPE_LABELS[type]}
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 border-2 border-yellow-500 bg-yellow-100" />
        Til behandling
      </div>
    </div>
  );
}
