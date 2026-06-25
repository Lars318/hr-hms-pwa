// Klient-side PDF-eksport av økonomikontrakter. Henter data fra
// /api/financial-contracts/export?format=json og bygger en tabell-PDF med
// jsPDF. Kjøres i nettleseren (dynamisk importert) for å unngå serverless
// font-/bundling-problemer.

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  year: number | null;
  generatedAt: string;
  count: number;
}

export async function exportContractsPdf(year?: number): Promise<void> {
  const params = new URLSearchParams({ format: "json" });
  if (year) params.set("year", String(year));

  const res = await fetch(`/api/financial-contracts/export?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(res.status === 403 ? "Du har ikke tilgang til eksport." : "Eksport feilet.");
  }
  const data: ExportData = await res.json();

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Tittel + metadata
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Økonomikontrakter", 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(120);
  const undertittel = `${data.year ? `År ${data.year} · ` : ""}${data.count} kontrakter · generert ${data.generatedAt}`;
  doc.text(undertittel, 40, 58);

  autoTable(doc, {
    startY: 74,
    head: [data.headers],
    body: data.rows.map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c)))),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [74, 124, 89], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 245] },
    margin: { left: 40, right: 40 },
  });

  // Sidefot med sidetall
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - 80, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`okonomikontrakter${data.year ? `-${data.year}` : ""}-${data.generatedAt}.pdf`);
}
