"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText, Loader2 } from "lucide-react";
import { exportContractsPdf } from "./exportPdf";
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handlePdf() {
    setExportError(null);
    setPdfLoading(true);
    try {
      await exportContractsPdf();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF-eksport feilet.");
    } finally {
      setPdfLoading(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => {
              window.location.href = "/api/financial-contracts/export";
            }}
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px]"
            disabled={pdfLoading}
            onClick={handlePdf}
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button className="min-h-[44px]" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Ny kontrakt</span>
          </Button>
        </div>
      </div>

      {exportError && (
        <p className="text-sm text-destructive">{exportError}</p>
      )}

      <FinancialContractKpiCards summary={summary} isLoading={summaryLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyCostChart />
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
              locations={locations}
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
