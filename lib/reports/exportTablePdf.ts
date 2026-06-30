// Generisk klient-side PDF-eksport av en tabell-rapport. Henter JSON fra et
// eksport-endepunkt (format=json) og bygger en liggende A4-tabell med jsPDF.

interface TableExportData {
  headers: string[];
  rows: (string | number)[][];
  generatedAt: string;
  count: number;
}

export async function exportTablePdf(opts: {
  endpoint: string; // f.eks. "/api/reports/who-works-where"
  title: string;
  fileBase: string; // f.eks. "hvem-jobber-hvor"
}): Promise<void> {
  const url = opts.endpoint + (opts.endpoint.includes("?") ? "&" : "?") + "format=json";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(res.status === 403 ? "Du har ikke tilgang til eksport." : "Eksport feilet.");
  }
  const data: TableExportData = await res.json();

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(opts.title, 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${data.count} rader · generert ${data.generatedAt}`, 40, 58);

  autoTable(doc, {
    startY: 74,
    head: [data.headers],
    body: data.rows.map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c)))),
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [74, 124, 89], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 245] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Side ${i} av ${pageCount}`, pageWidth - 80, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`${opts.fileBase}-${data.generatedAt}.pdf`);
}
