"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { LeaveFilters, type LeaveFilterState } from "./LeaveFilters";
import { LeaveRequestTable } from "./LeaveRequestTable";
import type { Role } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface LeaveListClientProps {
  viewerRole: Role;
}

export function LeaveListClient({ viewerRole }: LeaveListClientProps) {
  const [filters, setFilters] = useState<LeaveFilterState>({
    status: "",
    type: "",
    from: "",
    to: "",
  });

  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";
  const isManager = viewerRole === "MANAGER";
  const showEmployee = isHrAdmin || isManager;

  const { data: requests = [], isLoading } = trpc.leaveRequest.list.useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: (filters.status || undefined) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: (filters.type || undefined) as any,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  return (
    <div className="space-y-4">
      <LeaveFilters filters={filters} onChange={setFilters} />
      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={5} /></div></>
      ) : (
        <LeaveRequestTable requests={requests} showEmployee={showEmployee} canAdminDelete={viewerRole === "ADMIN"} />
      )}
      <p className="text-xs text-muted-foreground">{requests.length} søknad{requests.length !== 1 ? "er" : ""}</p>
    </div>
  );
}
