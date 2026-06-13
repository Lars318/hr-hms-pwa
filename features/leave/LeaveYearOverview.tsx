"use client";

import { MONTH_NAMES } from "@/lib/leave";
import type { LeaveRequestStatus, LeaveRequestType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CalendarLeave {
  id: string;
  type: LeaveRequestType;
  status: LeaveRequestStatus;
  startDate: Date;
  endDate: Date;
  days: number;
}

interface Props {
  year: number;
  leaves: CalendarLeave[];
  onSelectMonth: (month: number) => void;
}

function clampToMonth(date: Date, year: number, month: number): Date {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  if (date < first) return first;
  if (date > last) return last;
  return date;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function approvedDaysInMonth(leave: CalendarLeave, year: number, month: number): number {
  if (leave.status !== "APPROVED") return 0;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const effectiveStart = start < monthStart ? monthStart : start;
  const effectiveEnd = end > monthEnd ? monthEnd : end;
  if (effectiveStart > effectiveEnd) return 0;
  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / 86_400_000) + 1;
}

export function LeaveYearOverview({ year, leaves, onSelectMonth }: Props) {
  const today = new Date();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const monthLeaves = leaves.filter((l) => {
          const s = new Date(l.startDate);
          const e = new Date(l.endDate);
          const ms = new Date(year, month - 1, 1);
          const me = new Date(year, month, 0);
          return s <= me && e >= ms;
        });

        const approvedCount = monthLeaves
          .filter((l) => l.status === "APPROVED")
          .reduce((sum, l) => sum + approvedDaysInMonth(l, year, month), 0);

        const pendingCount = monthLeaves.filter((l) => l.status === "PENDING").length;

        const isCurrentMonth =
          today.getFullYear() === year && today.getMonth() + 1 === month;
        const isPast =
          year < today.getFullYear() ||
          (year === today.getFullYear() && month < today.getMonth() + 1);

        return (
          <button
            key={month}
            onClick={() => onSelectMonth(month)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrentMonth && "border-primary bg-primary/5",
              isPast && !isCurrentMonth && "opacity-70"
            )}
          >
            <p className={cn("text-sm font-semibold", isCurrentMonth && "text-primary")}>
              {MONTH_NAMES[month - 1]}
            </p>

            {monthLeaves.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Ingen fravær</p>
            ) : (
              <div className="mt-2 space-y-1">
                {approvedCount > 0 && (
                  <p className="text-xs text-green-700">
                    ✓ {approvedCount} dag{approvedCount !== 1 ? "er" : ""} godkjent
                  </p>
                )}
                {pendingCount > 0 && (
                  <p className="text-xs text-yellow-700">
                    ⏳ {pendingCount} søknad{pendingCount !== 1 ? "er" : ""} til behandling
                  </p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
