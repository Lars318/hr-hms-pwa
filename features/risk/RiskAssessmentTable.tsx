"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ASSESSMENT_STATUS_LABELS } from "@/lib/risk";
import type { Department, Role } from "@prisma/client";

interface RiskAssessmentTableProps {
  viewerRole: Role;
  departments: Pick<Department, "id" | "name">[];
}

export function RiskAssessmentTable({ viewerRole, departments }: RiskAssessmentTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deptId, setDeptId] = useState("");
  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";

  const { data = [], isLoading } = trpc.riskAssessment.list.useQuery({
    search: search || undefined,
    status: (status as "DRAFT") || undefined,
    departmentId: deptId || undefined,
  });

  const statusVariant = (s: string) => {
    if (s === "ACTIVE") return "success";
    if (s === "REVIEW") return "warning";
    if (s === "CLOSED") return "muted";
    return "secondary";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <Input placeholder="Søk på tittel…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 min-w-[9rem] sm:w-44 sm:flex-none">
          <option value="">Alle statuser</option>
          {Object.entries(ASSESSMENT_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        {isHrAdmin && (
          <Select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="flex-1 min-w-[9rem] sm:w-44 sm:flex-none">
            <option value="">Alle avdelinger</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        )}
      </div>

      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={4} /></div></>
      ) : data.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Ingen risikovurderinger funnet" description="Prøv å endre søk eller filter." />
      ) : (
        <>
          {/* ── Mobil: kort ──────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {data.map((a) => (
              <Link key={a.id} href={`/risiko/${a.id}`} className="block">
                <div className="rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <span className="font-medium line-clamp-2 flex-1 min-w-0">{a.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={statusVariant(a.status) as "secondary"}>
                      {ASSESSMENT_STATUS_LABELS[a.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground self-center">
                      {a._count.riskItems} risikopunkter
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground min-w-0">
                    <span className="truncate">{a.department?.name ?? "—"}</span>
                    {a.reviewDate && (
                      <span className="shrink-0 ml-2">
                        Gjennomgang: {format(new Date(a.reviewDate), "d. MMM yyyy", { locale: nb })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Desktop: tabell ──────────────────────────────────────── */}
          <div className="hidden md:block rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tittel</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Avdeling</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Risikopunkter</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Gjennomgang</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.department?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(a.status) as "secondary"}>{ASSESSMENT_STATUS_LABELS[a.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a._count.riskItems}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {a.reviewDate ? format(new Date(a.reviewDate), "d. MMM yyyy", { locale: nb }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/risiko/${a.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{data.length} risikovurderinger</p>
    </div>
  );
}
