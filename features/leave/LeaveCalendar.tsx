"use client";

import Link from "next/link";
import {
  buildMonthGrid,
  dateInRange,
  isSameDay,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  LEAVE_TYPE_CALENDAR_COLORS,
} from "@/lib/leave";
import { LeaveCalendarDay } from "./LeaveCalendarDay";
import { LeaveRequestStatusBadge } from "./LeaveRequestStatusBadge";
import { LeaveRequestTypeBadge } from "./LeaveRequestTypeBadge";
import type { LeaveRequestType, LeaveRequestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarLeave {
  id: string;
  type: LeaveRequestType;
  status: LeaveRequestStatus;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  employee: { id: string; fullName: string };
  department: { id: string; name: string } | null;
}

interface Props {
  year: number;
  month: number;
  leaves: CalendarLeave[];
  onPrev: () => void;
  onNext: () => void;
}

function formatDate(d: Date) {
  return format(d, "d. MMM yyyy", { locale: nb });
}

function buildWeekDays(baseDate: Date): Date[] {
  const mon = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

export function LeaveCalendar({ year, month, leaves, onPrev, onNext }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekBase, setWeekBase] = useState(() => new Date());
  const today = new Date();
  const grid = buildMonthGrid(year, month);

  function leavesForDay(date: Date) {
    return leaves.filter((l) => dateInRange(date, new Date(l.startDate), new Date(l.endDate)));
  }

  const selectedLeaves = selectedDate ? leavesForDay(selectedDate) : [];
  const weekDays = buildWeekDays(weekBase);

  // ── Delte detalj-panel ──────────────────────────────────────────────────
  const DetailPanel = ({ date }: { date: Date }) => {
    const dayLeaves = leavesForDay(date);
    return (
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-3 font-medium text-sm">
          {format(date, "EEEE d. MMMM", { locale: nb })}
        </h3>
        {dayLeaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen fravær.</p>
        ) : (
          <div className="space-y-2">
            {dayLeaves.map((leave) => (
              <Link
                key={leave.id}
                href={`/fravaer/${leave.id}`}
                className="flex items-start justify-between rounded-xl border p-3 hover:bg-accent/50 active:bg-accent transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", LEAVE_TYPE_CALENDAR_COLORS[leave.type])} />
                    <span className="text-sm font-medium truncate">{leave.employee.fullName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    <LeaveRequestTypeBadge type={leave.type} />
                    <LeaveRequestStatusBadge status={leave.status} />
                  </div>
                  <p className="pl-4 text-xs text-muted-foreground">
                    {formatDate(new Date(leave.startDate))} – {formatDate(new Date(leave.endDate))}
                    {" "}({leave.days} dag{leave.days !== 1 ? "er" : ""})
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Mobil: ukevisning ────────────────────────────────────────── */}
      <div className="md:hidden space-y-4">
        {/* Uke-navigasjon */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekBase(subWeeks(weekBase, 1))}
            className="flex items-center justify-center h-10 w-10 rounded-full border hover:bg-accent transition-colors"
            aria-label="Forrige uke"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {format(weekDays[0], "d. MMM", { locale: nb })} – {format(weekDays[6], "d. MMM yyyy", { locale: nb })}
          </span>
          <button
            onClick={() => setWeekBase(addWeeks(weekBase, 1))}
            className="flex items-center justify-center h-10 w-10 rounded-full border hover:bg-accent transition-colors"
            aria-label="Neste uke"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Ukeceller */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_NAMES.map((name) => (
            <div key={name} className="py-1 text-center text-[10px] font-medium text-muted-foreground">
              {name}
            </div>
          ))}
          {weekDays.map((date, idx) => {
            const dayLeaves = leavesForDay(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const hasFravær = dayLeaves.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl py-2 text-sm transition-colors min-h-[56px]",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && isToday && "bg-primary/10 text-primary font-semibold",
                  !isSelected && !isToday && "hover:bg-accent"
                )}
              >
                <span className="text-sm font-medium">{date.getDate()}</span>
                {hasFravær && (
                  <div className="flex gap-0.5 mt-1">
                    {dayLeaves.slice(0, 3).map((l, i) => (
                      <span
                        key={i}
                        className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground" : LEAVE_TYPE_CALENDAR_COLORS[l.type])}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Valgt dag detaljer */}
        {selectedDate && <DetailPanel date={selectedDate} />}

        {/* Månedsoversikt med lenker */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onPrev} className="flex items-center justify-center h-8 w-8 rounded-full border hover:bg-accent transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={onNext} className="flex items-center justify-center h-8 w-8 rounded-full border hover:bg-accent transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Mini månedsoversikt — alle fravær */}
          {leaves.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Ingen fravær denne måneden.</p>
          ) : (
            <div className="space-y-1.5">
              {leaves.slice(0, 5).map((l) => (
                <Link key={l.id} href={`/fravaer/${l.id}`} className="flex items-center gap-2 text-xs hover:underline">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", LEAVE_TYPE_CALENDAR_COLORS[l.type])} />
                  <span className="truncate font-medium">{l.employee.fullName}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {format(new Date(l.startDate), "d. MMM", { locale: nb })}
                  </span>
                </Link>
              ))}
              {leaves.length > 5 && (
                <p className="text-xs text-muted-foreground pl-4">+{leaves.length - 5} til</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: månedsgrid ──────────────────────────────────────── */}
      <div className="hidden md:block space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onPrev} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent min-h-[36px]">
            ← Forrige
          </button>
          <h2 className="text-lg font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
          <button onClick={onNext} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent min-h-[36px]">
            Neste →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_NAMES.map((name) => (
            <div key={name} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {name}
            </div>
          ))}
          {grid.flat().map((date, idx) => {
            const dayLeaves = leavesForDay(date);
            const isCurrentMonth = date.getMonth() === month - 1;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

            return (
              <LeaveCalendarDay
                key={idx}
                date={date}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isSelected={isSelected}
                leaves={dayLeaves}
                onClick={() => setSelectedDate(isSelected ? null : date)}
              />
            );
          })}
        </div>

        {selectedDate && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-medium">
              {format(selectedDate, "EEEE d. MMMM yyyy", { locale: nb })}
            </h3>
            {selectedLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen fravær denne dagen.</p>
            ) : (
              <div className="space-y-2">
                {selectedLeaves.map((leave) => (
                  <Link
                    key={leave.id}
                    href={`/fravaer/${leave.id}`}
                    className="flex items-start justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full flex-shrink-0", LEAVE_TYPE_CALENDAR_COLORS[leave.type])} />
                        <span className="text-sm font-medium">{leave.employee.fullName}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-4">
                        <LeaveRequestTypeBadge type={leave.type} />
                        <LeaveRequestStatusBadge status={leave.status} />
                      </div>
                      <p className="pl-4 text-xs text-muted-foreground">
                        {formatDate(new Date(leave.startDate))} – {formatDate(new Date(leave.endDate))}
                        {" "}({leave.days} dag{leave.days !== 1 ? "er" : ""})
                      </p>
                      {leave.department && (
                        <p className="pl-4 text-xs text-muted-foreground">{leave.department.name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
