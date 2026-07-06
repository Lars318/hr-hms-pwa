"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeeCards } from "./EmployeeCards";
import { EmployeeTable } from "./EmployeeTable";
import { BulkActionBar } from "./BulkActionBar";
import { ExportButton } from "./ExportButton";
import type { Department, Location } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface EmployeeListClientProps {
  departments: Department[];
  locations: Location[];
}

export function EmployeeListClient({ departments, locations }: EmployeeListClientProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    departmentId: "",
    locationId: "",
    title: "",
    employmentType: "",
    notInvited: searchParams.get("notInvited") === "1",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: employees = [], isLoading } = trpc.profile.list.useQuery({
    search: filters.search || undefined,
    role: (filters.role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") || undefined,
    status: (filters.status as "ACTIVE" | "INACTIVE") || undefined,
    departmentId: filters.departmentId || undefined,
    locationId: filters.locationId || undefined,
    title: filters.title || undefined,
    employmentType: (filters.employmentType as "EMPLOYEE" | "SELF_EMPLOYED") || undefined,
    notInvited: filters.notInvited || undefined,
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(employees.map((e) => e.id)) : new Set());
  }

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="space-y-4">
      <EmployeeFilters
        filters={filters}
        departments={departments}
        locations={locations}
        onChange={setFilters}
      />

      {selected.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selected)}
          departments={departments}
          locations={locations}
          onDone={clearSelection}
          onClear={clearSelection}
        />
      )}

      {isLoading ? (
        <>
          <div className="md:hidden"><ListCardSkeleton count={4} /></div>
          <div className="hidden md:block"><TableSkeleton rows={5} cols={6} /></div>
        </>
      ) : (
        <>
          <div className="md:hidden">
            <EmployeeCards employees={employees as Parameters<typeof EmployeeCards>[0]["employees"]} />
          </div>
          <EmployeeTable
            employees={employees as Parameters<typeof EmployeeTable>[0]["employees"]}
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        </>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{employees.length} ansatte</p>
        <ExportButton rows={employees as Parameters<typeof ExportButton>[0]["rows"]} disabled={isLoading} />
      </div>
    </div>
  );
}
