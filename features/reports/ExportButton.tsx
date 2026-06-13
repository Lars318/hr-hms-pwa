"use client";

import { Download } from "lucide-react";
import type { ReportType } from "@/lib/reports/queries";

interface Props {
  type: ReportType;
  from?: string;
  to?: string;
  departmentId?: string;
  disabled?: boolean;
}

export function ExportButton({ type, from, to, departmentId, disabled }: Props) {
  const params = new URLSearchParams({ type });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (departmentId) params.set("departmentId", departmentId);

  const href = `/api/reports/csv?${params.toString()}`;

  if (disabled) {
    return (
      <button
        disabled
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm text-muted-foreground opacity-50"
      >
        <Download className="h-4 w-4" />
        Eksporter CSV
      </button>
    );
  }

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
    >
      <Download className="h-4 w-4" />
      Eksporter CSV
    </a>
  );
}
