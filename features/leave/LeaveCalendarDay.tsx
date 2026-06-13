"use client";

import { cn } from "@/lib/utils";
import { LEAVE_TYPE_CALENDAR_COLORS } from "@/lib/leave";
import type { LeaveRequestType, LeaveRequestStatus } from "@prisma/client";

interface CalendarLeave {
  id: string;
  type: LeaveRequestType;
  status: LeaveRequestStatus;
  employee: { fullName: string };
}

interface Props {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  leaves: CalendarLeave[];
  onClick: () => void;
}

const MAX_DOTS = 3;

export function LeaveCalendarDay({ date, isCurrentMonth, isToday, isSelected, leaves, onClick }: Props) {
  const visible = leaves.slice(0, MAX_DOTS);
  const overflow = leaves.length - MAX_DOTS;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative min-h-[72px] w-full rounded-md border p-1.5 text-left transition-colors",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCurrentMonth ? "bg-card" : "bg-muted/30",
        isSelected && "ring-2 ring-primary border-primary",
        !isCurrentMonth && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
          isToday && "bg-primary text-primary-foreground",
          !isToday && isCurrentMonth && "text-foreground",
          !isToday && !isCurrentMonth && "text-muted-foreground"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-0.5 space-y-0.5">
        {visible.map((leave) => (
          <div
            key={leave.id}
            className={cn(
              "flex items-center gap-1 rounded px-1 py-0.5",
              leave.status === "PENDING"
                ? "border border-yellow-400 bg-yellow-50"
                : "bg-opacity-15",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                LEAVE_TYPE_CALENDAR_COLORS[leave.type]
              )}
            />
            <span className="truncate text-[10px] leading-none text-foreground">
              {leave.employee.fullName.split(" ")[0]}
            </span>
          </div>
        ))}
        {overflow > 0 && (
          <p className="px-1 text-[10px] text-muted-foreground">+{overflow} til</p>
        )}
      </div>
    </button>
  );
}
