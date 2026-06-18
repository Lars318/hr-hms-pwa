"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { IncidentFilters, type IncidentFilterState } from "./IncidentFilters";
import { IncidentTable } from "./IncidentTable";
import { getDrafts } from "@/lib/offline/drafts";
import { cn } from "@/lib/utils";
import type { Department, Role } from "@prisma/client";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface IncidentListClientProps {
  departments: Department[];
  viewerRole: Role;
}

type StatusTab = "" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "", label: "Alle" },
  { id: "OPEN", label: "Åpne" },
  { id: "IN_PROGRESS", label: "Pågående" },
  { id: "RESOLVED", label: "Lukkede" },
];

function DraftBanner() {
  const searchParams = useSearchParams();
  const draftSaved = searchParams.get("draft") === "saved";
  const [draftCount, setDraftCount] = useState(0);
  useEffect(() => {
    if (draftSaved) setDraftCount(getDrafts().length);
  }, [draftSaved]);
  if (!draftSaved) return null;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
      Avvik lagret som kladd ({draftCount} kladd venter). Sendes inn automatisk når du er tilkoblet igjen.
    </div>
  );
}

export function IncidentListClient({ departments, viewerRole }: IncidentListClientProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("");

  const [filters, setFilters] = useState<IncidentFilterState>({
    search: "",
    severity: "",
    status: "",
    departmentId: "",
  });

  const { data: incidents = [], isLoading } = trpc.incident.list.useQuery({
    search: filters.search || undefined,
    severity: (filters.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || undefined,
    status: (statusTab as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") || undefined,
    departmentId: filters.departmentId || undefined,
  });

  const showDeptFilter = viewerRole === "ADMIN" || viewerRole === "HR";

  return (
    <div className="space-y-4">
      <Suspense>
        <DraftBanner />
      </Suspense>

      {/* Søkebar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Søk i avvik…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full h-10 rounded-xl border bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Status-tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              statusTab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Avanserte filtre (severity, avdeling) */}
      <IncidentFilters
        filters={filters}
        departments={departments}
        showDeptFilter={showDeptFilter}
        onChange={setFilters}
        compact
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
