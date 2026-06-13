"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { IncidentFilters, type IncidentFilterState } from "./IncidentFilters";
import { IncidentTable } from "./IncidentTable";
import { getDrafts } from "@/lib/offline/drafts";
import type { Department, Role } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface IncidentListClientProps {
  departments: Department[];
  viewerRole: Role;
}

export function IncidentListClient({ departments, viewerRole }: IncidentListClientProps) {
  const searchParams = useSearchParams();
  const draftSaved = searchParams.get("draft") === "saved";
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    if (draftSaved) setDraftCount(getDrafts().length);
  }, [draftSaved]);

  const [filters, setFilters] = useState<IncidentFilterState>({
    search: "",
    severity: "",
    status: "",
    departmentId: "",
  });

  const { data: incidents = [], isLoading } = trpc.incident.list.useQuery({
    search: filters.search || undefined,
    severity: (filters.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || undefined,
    status: (filters.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") || undefined,
    departmentId: filters.departmentId || undefined,
  });

  // Avdelingsfilter vises kun for HR/ADMIN (MANAGER ser bare sin avdeling)
  const showDeptFilter = viewerRole === "ADMIN" || viewerRole === "HR";

  return (
    <div className="space-y-4">
      {draftSaved && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Avvik lagret som kladd ({draftCount} kladd venter). Sendes inn automatisk når du er tilkoblet igjen.
        </div>
      )}
      <IncidentFilters
        filters={filters}
        departments={departments}
        showDeptFilter={showDeptFilter}
        onChange={setFilters}
      />
      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={5} /></div></>
      ) : (
        <IncidentTable incidents={incidents} />
      )}
      <p className="text-xs text-muted-foreground">{incidents.length} avvik</p>
    </div>
  );
}
