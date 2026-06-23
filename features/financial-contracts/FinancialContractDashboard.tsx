"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FinancialContractKpiCards } from "./FinancialContractKpiCards";
import { MonthlyCostChart } from "./MonthlyCostChart";
import { ContractTypeDistribution } from "./ContractTypeDistribution";
import {
  FinancialContractFilters,
  type FilterState,
} from "./FinancialContractFilters";
import {
  FinancialContractTable,
  type ContractRow,
  type SortBy,
} from "./FinancialContractTable";
import { FinancialContractDetailPanel } from "./FinancialContractDetailPanel";
import { NewFinancialContractDialog } from "./NewFinancialContractDialog";

export function FinancialContractDashboard() {
  const [filters, setFilters] = useState<FilterState>({ search: "" });
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [newOpen, setNewOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } =
    trpc.financialContract.getSummary.useQuery();

  const { data: locationsData } = trpc.location.list.useQuery();
  const locations = useMemo(
    () => (locationsData ?? []).map((l) => ({ id: l.id, name: l.name })),
    [locationsData]
  );

  const { data, isLoading } = trpc.financialContract.list.useQuery({
    search: filters.search || undefined,
    type: filters.type,
    status: filters.status,
    locationId: filters.locationId,
    sortBy,
    sortDir,
  });

  const rows: ContractRow[] = useMemo(
    () =>
      (data?.items ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        supplierName: c.supplierName,
        status: c.status,
        monthlyAmount: c.monthlyAmount,
        endDate: c.endDate,
        location: c.location,
        centerName: c.centerName,
        _count: c._count,
      })),
    [data]
  );

  function handleSort(col: SortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kontrakter</h1>
          <p className="text-sm text-muted-foreground">
            Økonomi- og leiekontrakter for hele organisasjonen
          </p>
        </div>
        <Button className="min-h-[44px]" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Ny kontrakt</span>
        </Button>
      </div>

      <FinancialContractKpiCards summary={summary} isLoading={summaryLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyCostChart data={summary?.monthlyCostByMonth} />
        <ContractTypeDistribution data={summary?.valueByType} />
      </div>

      <FinancialContractFilters
        value={filters}
        onChange={setFilters}
        locations={locations}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 items-start">
        <FinancialContractTable
          rows={rows}
          isLoading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={setSelectedId}
          selectedId={selectedId}
        />

        {selectedId && (
          <div className="rounded-2xl overflow-hidden border xl:sticky xl:top-4 h-[600px]">
            <FinancialContractDetailPanel
              contractId={selectedId}
              onClose={() => setSelectedId(undefined)}
            />
          </div>
        )}
      </div>

      <NewFinancialContractDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        locations={locations}
      />
    </div>
  );
}
