"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeeTable } from "./EmployeeTable";
import type { Department } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface EmployeeListClientProps {
  departments: Department[];
}

export function EmployeeListClient({ departments }: EmployeeListClientProps) {
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    departmentId: "",
  });

  const { data: employees = [], isLoading } = trpc.profile.list.useQuery({
    search: filters.search || undefined,
    role: (filters.role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") || undefined,
    status: (filters.status as "ACTIVE" | "INACTIVE") || undefined,
    departmentId: filters.departmentId || undefined,
  });

  return (
    <div className="space-y-4">
      <EmployeeFilters filters={filters} departments={departments} onChange={setFilters} />
      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={6} /></div></>
      ) : (
        <EmployeeTable employees={employees} />
      )}
      <p className="text-xs text-muted-foreground">{employees.length} ansatte</p>
    </div>
  );
}
