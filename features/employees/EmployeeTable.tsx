"use client";

import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight, Users } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import type { Profile, Department } from "@prisma/client";

type EmployeeWithDept = Profile & { department: Department | null };

interface EmployeeTableProps {
  employees: EmployeeWithDept[];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Ingen ansatte funnet"
        description="Prøv å endre søk eller filter."
      />
    );
  }

  return (
    <>
      {/* ── Mobil: kort ──────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {employees.map((emp) => (
          <Link key={emp.id} href={`/ansatte/${emp.id}`} className="block">
            <div className="rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 select-none">
                  {initials(emp.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <span className="font-medium truncate">{emp.fullName}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {emp.title && (
                    <p className="text-xs text-muted-foreground truncate">{emp.title}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <RoleBadge role={emp.role} />
                    <StatusBadge status={emp.status} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground min-w-0">
                <span className="truncate">{emp.department?.name ?? "—"}</span>
                <span className="shrink-0 ml-2 truncate max-w-[10rem]">{emp.email}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Desktop: tabell ──────────────────────────────────────────── */}
      <div className="hidden md:block rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Navn</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-post</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rolle</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Avdeling</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Tittel</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Ansatt</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{emp.email}</td>
                <td className="px-4 py-3"><RoleBadge role={emp.role} /></td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {emp.department?.name ?? <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {emp.title ?? <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {format(new Date(emp.employedAt), "d. MMM yyyy", { locale: nb })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ansatte/${emp.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Vis ansatt</span>
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
