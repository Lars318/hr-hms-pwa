"use client";

import { trpc } from "@/lib/trpc/client";
import { Loader2, UserCircle } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  HR: "HR",
  MANAGER: "Leder",
  EMPLOYEE: "Ansatt",
};

export function DepartmentEmployees({ departmentId }: { departmentId: string }) {
  const { data, isLoading } = trpc.department.employees.useQuery({ id: departmentId });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Laster ansatte…
      </div>
    );
  }

  const employees = data?.employees ?? [];

  if (employees.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        Ingen ansatte er tilknyttet denne avdelingen.
      </p>
    );
  }

  return (
    <ul className="divide-y bg-muted/20">
      {employees.map((e) => (
        <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
          <UserCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {e.fullName}
              {e.status !== "ACTIVE" && (
                <span className="ml-1.5 text-xs text-muted-foreground">(inaktiv)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {[e.title, e.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          {e.employeeNumber && (
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              #{e.employeeNumber}
            </span>
          )}
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
            {ROLE_LABEL[e.role] ?? e.role}
          </span>
        </li>
      ))}
    </ul>
  );
}
