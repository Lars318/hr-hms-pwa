"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface IncidentFilterState {
  search: string;
  severity: string;
  status: string;
  departmentId: string;
}

interface Department {
  id: string;
  name: string;
}

interface IncidentFiltersProps {
  filters: IncidentFilterState;
  departments: Department[];
  showDeptFilter: boolean;
  onChange: (f: IncidentFilterState) => void;
  compact?: boolean;
}

export function IncidentFilters({ filters, departments, showDeptFilter, onChange, compact }: IncidentFiltersProps) {
  function set(key: keyof IncidentFilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!compact && (
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Søk på tittel eller beskrivelse…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>
      )}

      <Select value={filters.severity} onChange={(e) => set("severity", e.target.value)} className="w-36">
        <option value="">Alle alvorlighetsgrader</option>
        <option value="CRITICAL">Kritisk</option>
        <option value="HIGH">Høy</option>
        <option value="MEDIUM">Middels</option>
        <option value="LOW">Lav</option>
      </Select>

      {!compact && (
        <Select value={filters.status} onChange={(e) => set("status", e.target.value)} className="w-40">
          <option value="">Alle statuser</option>
          <option value="OPEN">Åpen</option>
          <option value="IN_PROGRESS">Under arbeid</option>
          <option value="RESOLVED">Løst</option>
          <option value="CLOSED">Lukket</option>
        </Select>
      )}

      {showDeptFilter && (
        <Select value={filters.departmentId} onChange={(e) => set("departmentId", e.target.value)} className="w-44">
          <option value="">Alle avdelinger</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      )}
    </div>
  );
}
