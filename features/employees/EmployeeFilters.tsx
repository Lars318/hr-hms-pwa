"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Filters {
  search: string;
  role: string;
  status: string;
  departmentId: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeFiltersProps {
  filters: Filters;
  departments: Department[];
  onChange: (filters: Filters) => void;
}

export function EmployeeFilters({ filters, departments, onChange }: EmployeeFiltersProps) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Søk på navn eller e-post…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </div>

      <Select value={filters.role} onChange={(e) => set("role", e.target.value)} className="w-40">
        <option value="">Alle roller</option>
        <option value="ADMIN">Administrator</option>
        <option value="HR">HR</option>
        <option value="MANAGER">Leder</option>
        <option value="EMPLOYEE">Ansatt</option>
      </Select>

      <Select value={filters.status} onChange={(e) => set("status", e.target.value)} className="w-36">
        <option value="">Alle statuser</option>
        <option value="ACTIVE">Aktiv</option>
        <option value="INACTIVE">Inaktiv</option>
      </Select>

      <Select value={filters.departmentId} onChange={(e) => set("departmentId", e.target.value)} className="w-44">
        <option value="">Alle avdelinger</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
    </div>
  );
}
