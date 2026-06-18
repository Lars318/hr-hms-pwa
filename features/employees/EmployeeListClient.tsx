"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeeCards } from "./EmployeeCards";
import { EmployeeTable } from "./EmployeeTable";
import type { Department, Location } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface EmployeeListClientProps {
  departments: Department[];
  locations: Location[];
}

export function EmployeeListClient({ departments, locations }: EmployeeListClientProps) {
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    departmentId: "",
    locationId: "",
  });

  const { data: employees = [], isLoading } = trpc.profile.list.useQuery({
    search: filters.search || undefined,
    role: (filters.role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") || undefined,
    status: (filters.status as "ACTIVE" | "INACTIVE") || undefined,
    departmentId: filters.departmentId || undefined,
    locationId: filters.locationId || undefined,
  });

  return (
    <div className="space-y-4">
      <EmployeeFilters
        filters={filters}
        departments={departments}
        locations={locations}
        onChange={setFilters}
      />
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
          <div className="hidden md:block">
            <EmployeeTable employees={employees as Parameters<typeof EmployeeTable>[0]["employees"]} />
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{employees.length} ansatte</p>
    </div>
  );
}
