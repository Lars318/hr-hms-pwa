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

export type EmployeeRow = Profile & {
  department: Department | null;
  profileAssignments: { location: { id: string; name: string; city: string | null } | null }[];
  extraDepartments: { department: { id: string; name: string } }[];
};

interface EmployeeTableProps {
  employees: EmployeeRow[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

function primaryLocation(emp: EmployeeRow): string | null {
  return emp.profileAssignments[0]?.location?.name ?? null;
}

export function EmployeeTable({ employees, selectedIds, onToggle, onToggleAll }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Ingen ansatte funnet"
        description="Prøv å endre søk eller filter."
      />
    );
  }

  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e.id));

  return (
    <div className="hidden md:block rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-3 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-input"
                aria-label="Velg alle"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Navn</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-post</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rolle</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Avdeling</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Lokasjon</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Tittel</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const loc = primaryLocation(emp);
            const extra = emp.extraDepartments.length;
            const selected = selectedIds.has(emp.id);
            return (
              <tr
                key={emp.id}
                className={`border-b last:border-0 transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(emp.id)}
                    className="h-4 w-4 rounded border-input"
                    aria-label={`Velg ${emp.fullName}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{emp.email}</td>
                <td className="px-4 py-3"><RoleBadge role={emp.role} /></td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {emp.department?.name ?? <span className="text-muted-foreground/50">—</span>}
                  {extra > 0 && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      title={emp.extraDepartments.map((d) => d.department.name).join(", ")}>
                      +{extra}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {loc ?? <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {emp.title ?? <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={emp.status} />
                    {emp.employmentType === "SELF_EMPLOYED" && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                        Selvstendig
                      </span>
                    )}
                    {!emp.invitedAt && emp.status === "ACTIVE" && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                        Ikke invitert
                      </span>
                    )}
                  </div>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
