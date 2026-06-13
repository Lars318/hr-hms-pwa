"use client";

import type { LeaveRequestStatus, LeaveRequestType } from "@prisma/client";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from "@/lib/leave";
import type { ChangeEvent } from "react";

const ALL_TYPES: LeaveRequestType[] = [
  "VACATION", "SICK_LEAVE", "CARE_LEAVE",
  "PARENTAL_LEAVE", "UNPAID_LEAVE", "OTHER",
];

const CALENDAR_STATUSES: LeaveRequestStatus[] = ["PENDING", "APPROVED"];

interface Props {
  departments: { id: string; name: string }[];
  showDeptFilter: boolean;
  departmentId: string;
  onDepartmentChange: (v: string) => void;
  statuses: LeaveRequestStatus[];
  onStatusChange: (v: LeaveRequestStatus[]) => void;
  types: LeaveRequestType[];
  onTypeChange: (v: LeaveRequestType[]) => void;
}

export function LeaveCalendarFilters({
  departments,
  showDeptFilter,
  departmentId,
  onDepartmentChange,
  statuses,
  onStatusChange,
  types,
  onTypeChange,
}: Props) {
  function toggleStatus(s: LeaveRequestStatus) {
    onStatusChange(
      statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s]
    );
  }

  function toggleType(t: LeaveRequestType) {
    onTypeChange(
      types.includes(t) ? types.filter((x) => x !== t) : [...types, t]
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {showDeptFilter && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Avdeling</label>
          <select
            value={departmentId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onDepartmentChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Alle avdelinger</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <div className="flex gap-2">
          {CALENDAR_STATUSES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={statuses.includes(s)}
                onChange={() => toggleStatus(s)}
                className="h-3.5 w-3.5 rounded border-input"
              />
              {LEAVE_STATUS_LABELS[s]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Type</span>
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={types.includes(t)}
                onChange={() => toggleType(t)}
                className="h-3.5 w-3.5 rounded border-input"
              />
              {LEAVE_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
