"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { LeaveCalendar } from "@/features/leave/LeaveCalendar";
import { LeaveYearOverview } from "@/features/leave/LeaveYearOverview";
import { LeaveCalendarFilters } from "@/features/leave/LeaveCalendarFilters";
import { LeaveLegend } from "@/features/leave/LeaveLegend";
import type { LeaveRequestStatus, LeaveRequestType } from "@prisma/client";

type ViewMode = "month" | "year";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function LeaveCalendarPage() {
  const [view, setView] = useState<ViewMode>("month");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [departmentId, setDepartmentId] = useState("");
  const [statuses, setStatuses] = useState<LeaveRequestStatus[]>(["PENDING", "APPROVED"]);
  const [types, setTypes] = useState<LeaveRequestType[]>([]);

  const { data: profile } = trpc.profile.me.useQuery();
  const { data: departments = [] } = trpc.department.list.useQuery();

  const isHrAdmin = profile?.role === "ADMIN" || profile?.role === "HR";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leavesRaw = [], isLoading } = trpc.leaveRequest.calendar.useQuery(
    {
      year,
      month: view === "month" ? month : undefined,
      departmentId: departmentId || undefined,
      status: statuses.length > 0 ? statuses : undefined,
      type: types.length > 0 ? types : undefined,
    },
    { enabled: !!profile }
  );
  // Cast: tRPC infers all Prisma fields; components only need CalendarLeave subset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaves = leavesRaw as unknown as any[];

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function selectMonth(m: number) {
    setMonth(m);
    setView("month");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fraværskalender</h1>
          <p className="text-sm text-muted-foreground">
            Oversikt over godkjent og ventende fravær
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded border px-2 py-1 text-sm hover:bg-accent"
            >
              ←
            </button>
            <span className="min-w-[4rem] text-center text-sm font-medium">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded border px-2 py-1 text-sm hover:bg-accent"
            >
              →
            </button>
          </div>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-md border">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              Måned
            </button>
            <button
              onClick={() => setView("year")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "year" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              År
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <LeaveCalendarFilters
          departments={departments}
          showDeptFilter={isHrAdmin}
          departmentId={departmentId}
          onDepartmentChange={setDepartmentId}
          statuses={statuses}
          onStatusChange={setStatuses}
          types={types}
          onTypeChange={setTypes}
        />
      </div>

      {/* Legend */}
      <LeaveLegend />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Calendar / Year view */}
      {!isLoading && view === "month" && (
        <LeaveCalendar
          year={year}
          month={month}
          leaves={leaves}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      )}

      {!isLoading && view === "year" && (
        <LeaveYearOverview
          year={year}
          leaves={leaves}
          onSelectMonth={selectMonth}
        />
      )}
    </div>
  );
}
