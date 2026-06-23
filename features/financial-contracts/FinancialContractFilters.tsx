"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import {
  TYPE_OPTIONS,
  STATUS_OPTIONS,
} from "./labels";
import type {
  FinancialContractType,
  FinancialContractStatus,
} from "@prisma/client";

export interface FilterState {
  search: string;
  type?: FinancialContractType;
  status?: FinancialContractStatus;
  locationId?: string;
}

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  locations: { id: string; name: string }[];
}

export function FinancialContractFilters({ value, onChange, locations }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Søk navn, leverandør, nummer…"
            className="pl-9"
          />
        </div>
        <Select
          className="sm:w-44"
          value={value.status ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              status: (e.target.value || undefined) as
                | FinancialContractStatus
                | undefined,
            })
          }
        >
          <option value="">Alle statuser</option>
          {STATUS_OPTIONS.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          className="sm:w-44"
          value={value.locationId ?? ""}
          onChange={(e) =>
            onChange({ ...value, locationId: e.target.value || undefined })
          }
        >
          <option value="">Alle sentre</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...value, type: undefined })}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !value.type
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent border-input"
          )}
        >
          Alle typer
        </button>
        {TYPE_OPTIONS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() =>
              onChange({ ...value, type: value.type === v ? undefined : v })
            }
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              value.type === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
