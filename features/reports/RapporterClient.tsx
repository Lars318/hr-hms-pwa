"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ReportFilters } from "./ReportFilters";
import { ReportTable } from "./ReportTable";
import { ExportButton } from "./ExportButton";
import type { ReportType } from "@/lib/reports/queries";
import type { Role } from "@prisma/client";

const REPORT_TABS: { type: ReportType; label: string }[] = [
  { type: "incidents", label: "Avvik" },
  { type: "actions", label: "Tiltak" },
  { type: "risk", label: "Risiko" },
  { type: "documents", label: "Dokumentlesing" },
  { type: "leave", label: "Fravær" },
  { type: "handbook", label: "Personalhåndbok" },
];

interface Props {
  viewerRole: Role;
  departments: { id: string; name: string }[];
}

export function RapporterClient({ viewerRole, departments }: Props) {
  const [activeType, setActiveType] = useState<ReportType>("incidents");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";

  const { data, isLoading, isError } = trpc.report.query.useQuery(
    {
      type: activeType,
      from: from || undefined,
      to: to || undefined,
      departmentId: departmentId || undefined,
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Report type tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {REPORT_TABS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              activeType === type
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <ReportFilters
          from={from}
          to={to}
          departmentId={departmentId}
          departments={departments}
          showDeptFilter={isHrAdmin}
          onFromChange={setFrom}
          onToChange={setTo}
          onDepartmentChange={setDepartmentId}
        />
      </div>

      {/* Preview + export */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">
            {REPORT_TABS.find((t) => t.type === activeType)?.label}
          </h2>
          <ExportButton
            type={activeType}
            from={from || undefined}
            to={to || undefined}
            departmentId={departmentId || undefined}
            disabled={isLoading || (data?.total ?? 0) === 0}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {isError && (
          <p className="py-8 text-center text-sm text-destructive">
            Kunne ikke laste rapport. Prøv igjen.
          </p>
        )}

        {!isLoading && !isError && data && (
          <ReportTable
            headers={data.headers}
            rows={data.rows}
            total={data.total}
          />
        )}
      </div>
    </div>
  );
}
