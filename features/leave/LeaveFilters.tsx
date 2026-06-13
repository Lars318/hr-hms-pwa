"use client";

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from "@/lib/leave";

export interface LeaveFilterState {
  status: string;
  type: string;
  from: string;
  to: string;
}

interface LeaveFiltersProps {
  filters: LeaveFilterState;
  onChange: (f: LeaveFilterState) => void;
}

export function LeaveFilters({ filters, onChange }: LeaveFiltersProps) {
  const set = (key: keyof LeaveFilterState) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.status}
        onChange={set("status")}
        className="w-44"
        aria-label="Filtrer på status"
      >
        <option value="">Alle statuser</option>
        {(Object.keys(LEAVE_STATUS_LABELS) as Array<keyof typeof LEAVE_STATUS_LABELS>).map((s) => (
          <option key={s} value={s}>{LEAVE_STATUS_LABELS[s]}</option>
        ))}
      </Select>

      <Select
        value={filters.type}
        onChange={set("type")}
        className="w-52"
        aria-label="Filtrer på type"
      >
        <option value="">Alle typer</option>
        {(Object.keys(LEAVE_TYPE_LABELS) as Array<keyof typeof LEAVE_TYPE_LABELS>).map((t) => (
          <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
        ))}
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.from}
          onChange={set("from")}
          className="w-36"
          aria-label="Fra dato"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="date"
          value={filters.to}
          onChange={set("to")}
          className="w-36"
          aria-label="Til dato"
        />
      </div>
    </div>
  );
}
