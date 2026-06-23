"use client";

import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Paperclip } from "lucide-react";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE,
  formatNOK,
  formatDate,
} from "./labels";
import type {
  FinancialContractType,
  FinancialContractStatus,
} from "@prisma/client";

export type SortBy =
  | "name"
  | "supplierName"
  | "endDate"
  | "monthlyAmount"
  | "createdAt";

export interface ContractRow {
  id: string;
  name: string;
  type: FinancialContractType;
  supplierName: string;
  status: FinancialContractStatus;
  monthlyAmount: number | null;
  endDate: string | Date | null;
  location: { id: string; name: string } | null;
  centerName: string | null;
  _count: { attachments: number };
}

interface Props {
  rows: ContractRow[];
  isLoading?: boolean;
  sortBy: SortBy;
  sortDir: "asc" | "desc";
  onSort: (col: SortBy) => void;
  onRowClick: (id: string) => void;
  selectedId?: string;
}

const columns: { key: SortBy; label: string; sortable: boolean }[] = [
  { key: "name", label: "Navn", sortable: true },
  { key: "supplierName", label: "Leverandør", sortable: true },
  { key: "monthlyAmount", label: "Mnd. kostnad", sortable: true },
  { key: "endDate", label: "Utløper", sortable: true },
];

export function FinancialContractTable({
  rows,
  isLoading,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  selectedId,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium">
                {c.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {c.label}
                    {sortBy === c.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Senter</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-b">
                <td colSpan={7} className="px-4 py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-muted/40" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                Ingen kontrakter funnet.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick(r.id)}
                className={cn(
                  "border-b cursor-pointer transition-colors hover:bg-accent/50",
                  selectedId === r.id && "bg-accent"
                )}
              >
                <td className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    {r.name}
                    {r._count.attachments > 0 && (
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.supplierName}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatNOK(r.monthlyAmount)}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatDate(r.endDate)}</td>
                <td className="px-4 py-3">{TYPE_LABELS[r.type]}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.location?.name ?? r.centerName ?? "–"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_BADGE[r.status]
                    )}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
