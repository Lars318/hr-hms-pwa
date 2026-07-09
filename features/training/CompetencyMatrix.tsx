"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle2, AlertTriangle, XCircle, Minus, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department { id: string; name: string }

function StatusCell({ status, date }: { status: string; date?: Date | null }) {
  if (status === "ok") return (
    <div title={date ? `Fullført ${format(new Date(date), "d. MMM yyyy", { locale: nb })}` : "Fullført"}
      className="flex justify-center">
      <CheckCircle2 className="h-4 w-4 text-primary" />
    </div>
  );
  if (status === "expiring") return (
    <div title={date ? `Utløper ${format(new Date(date), "d. MMM yyyy", { locale: nb })}` : "Utløper snart"}
      className="flex justify-center">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    </div>
  );
  if (status === "expired") return (
    <div title={date ? `Utløpt ${format(new Date(date), "d. MMM yyyy", { locale: nb })}` : "Utløpt"}
      className="flex justify-center">
      <XCircle className="h-4 w-4 text-destructive" />
    </div>
  );
  return (
    <div className="flex justify-center">
      <Minus className="h-4 w-4 text-muted-foreground/30" />
    </div>
  );
}

export function CompetencyMatrix({ departments }: { departments: Department[] }) {
  const [departmentId, setDepartmentId] = useState("");
  const [requiredOnly, setRequiredOnly] = useState(false);

  const { data, isLoading } = trpc.training.matrix.useQuery({ departmentId: departmentId || undefined, requiredOnly });

  function exportCsv() {
    if (!data) return;
    const headers = ["Ansatt", "Avdeling", ...data.courses.map((c) => c.name)];
    const rows = data.rows.map((r) => [
      r.profile.fullName,
      r.profile.department?.name ?? "",
      ...r.cells.map((c) => {
        if (c.status === "ok") return "OK";
        if (c.status === "expiring") return "Utløper snart";
        if (c.status === "expired") return "Utløpt";
        return "Mangler";
      }),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kompetansematrise.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = data ? {
    total: data.rows.length * data.courses.length,
    ok: data.rows.reduce((s, r) => s + r.cells.filter((c) => c.status === "ok").length, 0),
    expiring: data.rows.reduce((s, r) => s + r.cells.filter((c) => c.status === "expiring").length, 0),
    expired: data.rows.reduce((s, r) => s + r.cells.filter((c) => c.status === "expired").length, 0),
    missing: data.rows.reduce((s, r) => s + r.cells.filter((c) => c.status === "missing").length, 0),
  } : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-2xl border bg-card px-3 py-2 text-sm"
        >
          <option value="">Alle avdelinger</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={requiredOnly}
            onChange={(e) => setRequiredOnly(e.target.checked)}
            className="rounded"
          />
          Kun obligatoriske kurs
        </label>

        <button
          onClick={exportCsv}
          disabled={!data}
          className="ml-auto flex items-center gap-1.5 rounded-2xl border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Eksporter CSV
        </button>
      </div>

      {/* Summary chips */}
      {summary && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
            <CheckCircle2 className="h-3 w-3" /> {summary.ok} fullført
          </span>
          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-yellow-700 font-medium">
            <AlertTriangle className="h-3 w-3" /> {summary.expiring} utløper snart
          </span>
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-destructive font-medium">
            <XCircle className="h-3 w-3" /> {summary.expired} utløpt
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground font-medium">
            <Minus className="h-3 w-3" /> {summary.missing} mangler
          </span>
        </div>
      )}

      {/* Matrix table */}
      {isLoading && (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground animate-pulse">
          Laster matrise…
        </div>
      )}

      {data && data.courses.length === 0 && (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
          Ingen aktive kurs funnet.
        </div>
      )}

      {data && data.courses.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground min-w-[180px]">
                  Ansatt
                </th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground min-w-[120px]">
                  Avdeling
                </th>
                {data.courses.map((c) => (
                  <th
                    key={c.id}
                    title={c.name}
                    className="px-3 py-3 font-medium text-muted-foreground min-w-[80px] max-w-[100px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] writing-mode-vertical truncate max-w-[90px] text-center leading-tight">
                        {c.name}
                      </span>
                      {c.isRequired && (
                        <span className="text-[9px] bg-destructive/10 text-destructive px-1 rounded">Obl.</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr
                  key={row.profile.id}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/5")}
                >
                  <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">
                    {row.profile.fullName}
                    {row.profile.title && (
                      <span className="block text-xs text-muted-foreground font-normal">{row.profile.title}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">
                    {row.profile.department?.name ?? "—"}
                  </td>
                  {row.cells.map((cell, j) => (
                    <td key={j} className="px-3 py-2.5 text-center">
                      <StatusCell status={cell.status} date={"completedAt" in cell ? cell.completedAt : "expiresAt" in cell ? cell.expiresAt : null} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Fullført / gyldig</span>
        <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Utløper innen 30 dager</span>
        <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" /> Utløpt</span>
        <span className="flex items-center gap-1"><Minus className="h-3.5 w-3.5 text-muted-foreground/40" /> Ikke gjennomført</span>
      </div>
    </div>
  );
}
