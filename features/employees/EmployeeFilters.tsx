"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Filters {
  search: string;
  role: string;
  status: string;
  departmentId: string;
  locationId: string;
  title: string;
  employmentType: string;
}

interface Department { id: string; name: string }
interface Location { id: string; name: string; city: string | null }

interface EmployeeFiltersProps {
  filters: Filters;
  departments: Department[];
  locations: Location[];
  onChange: (filters: Filters) => void;
}

const ROLE_CHIPS = [
  { value: "", label: "Alle" },
  { value: "ADMIN", label: "Admin" },
  { value: "HR", label: "HR" },
  { value: "MANAGER", label: "Leder" },
  { value: "EMPLOYEE", label: "Ansatt" },
];

const TITLE_CHIPS = [
  { value: "", label: "Alle titler" },
  { value: "Resepsjonist", label: "Resepsjonist" },
  { value: "Instruktør", label: "Instruktør" },
  { value: "Personlig Trener", label: "Personlig Trener" },
];

export function EmployeeFilters({ filters, departments, locations, onChange }: EmployeeFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasAdvancedFilter = !!filters.departmentId || !!filters.locationId || !!filters.status || !!filters.employmentType;

  return (
    <div className="space-y-3">
      {/* Søkefelt + filterknapp */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Søk navn eller e-post…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors shrink-0",
            showAdvanced || hasAdvancedFilter
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-background text-muted-foreground hover:bg-accent"
          )}
          aria-label="Avanserte filtre"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Rolle-chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ROLE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => set("role", chip.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              filters.role === chip.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Tittel-chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TITLE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => set("title", filters.title === chip.value ? "" : chip.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              filters.title === chip.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Lokasjon-chips (alltid synlig hvis lokasjoner finnes) */}
      {locations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => set("locationId", "")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              !filters.locationId
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Alle lokasjoner
          </button>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => set("locationId", filters.locationId === loc.id ? "" : loc.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                filters.locationId === loc.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {loc.city ?? loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Avanserte filtre */}
      {showAdvanced && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Filtre</span>
            {hasAdvancedFilter && (
              <button
                onClick={() => onChange({ ...filters, departmentId: "", locationId: "", status: "", employmentType: "" })}
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X className="h-3 w-3" /> Nullstill
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={filters.status}
                onChange={(e) => set("status", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tilknytning</label>
              <select
                value={filters.employmentType}
                onChange={(e) => set("employmentType", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle</option>
                <option value="EMPLOYEE">Ansatt</option>
                <option value="SELF_EMPLOYED">Selvstendig næringsdrivende</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Avdeling</label>
              <select
                value={filters.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle avdelinger</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Lokasjon</label>
              <select
                value={filters.locationId}
                onChange={(e) => set("locationId", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Alle lokasjoner</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}{l.city ? `, ${l.city}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
