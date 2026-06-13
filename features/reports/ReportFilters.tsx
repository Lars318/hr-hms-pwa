"use client";

import type { ChangeEvent } from "react";

interface Props {
  from: string;
  to: string;
  departmentId: string;
  departments: { id: string; name: string }[];
  showDeptFilter: boolean;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onDepartmentChange: (v: string) => void;
}

export function ReportFilters({
  from,
  to,
  departmentId,
  departments,
  showDeptFilter,
  onFromChange,
  onToChange,
  onDepartmentChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Fra dato</label>
        <input
          type="date"
          value={from}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFromChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Til dato</label>
        <input
          type="date"
          value={to}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onToChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>

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

      <button
        onClick={() => {
          onFromChange("");
          onToChange("");
          onDepartmentChange("");
        }}
        className="h-8 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
      >
        Nullstill
      </button>
    </div>
  );
}
