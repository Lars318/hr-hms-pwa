"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { ActionPriorityBadge } from "./ActionPriorityBadge";
import type { Department, Profile, Role } from "@prisma/client";

interface ActionTableProps {
  viewerRole: Role;
  departments: Pick<Department, "id" | "name">[];
  employees: Pick<Profile, "id" | "fullName">[];
}

export function ActionTable({ viewerRole, departments, employees }: ActionTableProps) {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";

  const { data = [], isLoading } = trpc.action.list.useQuery({
    status: (status as "OPEN") || undefined,
    priority: (priority as "LOW") || undefined,
    assignedToId: assignedToId || undefined,
    departmentId: deptId || undefined,
    overdueOnly: overdueOnly || undefined,
  });

  const isOverdue = (a: { dueDate: Date | null; status: string }) =>
    !!a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "DONE" && a.status !== "CANCELLED";

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 min-w-[8rem] sm:w-36 sm:flex-none">
          <option value="">Alle statuser</option>
          <option value="OPEN">Åpen</option>
          <option value="IN_PROGRESS">Pågår</option>
          <option value="DONE">Fullført</option>
          <option value="CANCELLED">Avbrutt</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="flex-1 min-w-[8rem] sm:w-36 sm:flex-none">
          <option value="">Alle prioriteter</option>
          <option value="LOW">Lav</option>
          <option value="MEDIUM">Middels</option>
          <option value="HIGH">Høy</option>
          <option value="CRITICAL">Kritisk</option>
        </Select>
        {isHrAdmin && (
          <>
            <Select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="flex-1 min-w-[9rem] sm:w-44 sm:flex-none">
              <option value="">Alle avdelinger</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="flex-1 min-w-[9rem] sm:w-44 sm:flex-none">
              <option value="">Alle ansvarlige</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </Select>
          </>
        )}
        <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Kun forfalt
        </label>
      </div>

      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={5} /></div></>
      ) : data.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Ingen tiltak funnet" description="Prøv å endre filter." />
      ) : (
        <>
          {/* ── Mobil: kort ──────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {data.map((a) => {
              const overdue = isOverdue(a);
              return (
                <Link key={a.id} href={`/tiltak/${a.id}`} className="block">
                  <div className={`rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors ${overdue ? "border-destructive/50" : ""}`}>
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {overdue && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                        <span className="font-medium line-clamp-2 min-w-0">{a.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionStatusBadge status={a.status} />
                      <ActionPriorityBadge priority={a.priority} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground min-w-0">
                      <span className="truncate">{a.assignedTo?.fullName ?? "Ikke tildelt"}</span>
                      {a.dueDate && (
                        <span className={`shrink-0 ml-2 ${overdue ? "text-destructive font-medium" : ""}`}>
                          {format(new Date(a.dueDate), "d. MMM yyyy", { locale: nb })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Desktop: tabell ──────────────────────────────────────── */}
          <div className="hidden md:block rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tiltak</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prioritet</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Ansvarlig</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Frist</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {data.map((a) => {
                  const overdue = isOverdue(a);
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                          <span className="font-medium line-clamp-1">{a.title}</span>
                        </div>
                        {a.department && <p className="text-xs text-muted-foreground mt-0.5">{a.department.name}</p>}
                      </td>
                      <td className="px-4 py-3"><ActionPriorityBadge priority={a.priority} /></td>
                      <td className="px-4 py-3"><ActionStatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a.assignedTo?.fullName ?? "—"}</td>
                      <td className={`px-4 py-3 hidden lg:table-cell text-sm ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {a.dueDate ? format(new Date(a.dueDate), "d. MMM yyyy", { locale: nb }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/tiltak/${a.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{data.length} tiltak</p>
    </div>
  );
}
