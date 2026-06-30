"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTablePdf } from "@/lib/reports/exportTablePdf";

export function ReportExportButtons({
  endpoint, title, fileBase,
}: {
  endpoint: string;
  title: string;
  fileBase: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePdf() {
    setError(null);
    setPdfLoading(true);
    try {
      await exportTablePdf({ endpoint, title, fileBase });
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF-eksport feilet.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="min-h-[44px]" onClick={() => { window.location.href = endpoint; }}>
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
      <Button variant="outline" className="min-h-[44px]" disabled={pdfLoading} onClick={handlePdf}>
        {pdfLoading ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <FileText className="h-4 w-4 sm:mr-2" />}
        <span className="hidden sm:inline">PDF</span>
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
