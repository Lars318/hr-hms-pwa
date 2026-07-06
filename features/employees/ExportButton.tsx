"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportRow = {
  fullName: string;
  email: string;
  phone: string | null;
  employeeNumber?: string | null;
  role: string;
  status: string;
  employmentType: string;
  title: string | null;
  invitedAt: Date | null;
  employedAt: Date | string;
  department: { name: string } | null;
  profileAssignments: { location: { name: string } | null }[];
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator", HR: "HR", MANAGER: "Leder", EMPLOYEE: "Ansatt",
};

interface Props {
  rows: ExportRow[];
  disabled?: boolean;
}

/**
 * Eksporterer den (filtrerte) ansattlista til en .xlsx-fil.
 * SheetJS lastes dynamisk slik at den ikke øker første sidelast.
 */
export function ExportButton({ rows, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const data = rows.map((r) => ({
        Navn: r.fullName,
        "E-post": r.email,
        Telefon: r.phone ?? "",
        Ansattnummer: r.employeeNumber ?? "",
        Rolle: ROLE_LABEL[r.role] ?? r.role,
        Status: r.status === "ACTIVE" ? "Aktiv" : "Inaktiv",
        Tilknytning: r.employmentType === "SELF_EMPLOYED" ? "Selvstendig næringsdrivende" : "Ansatt",
        Tittel: r.title ?? "",
        Avdeling: r.department?.name ?? "",
        Lokasjon: r.profileAssignments?.[0]?.location?.name ?? "",
        Invitert: r.invitedAt ? "Ja" : "Nei",
        Ansatt: r.employedAt ? format(new Date(r.employedAt), "yyyy-MM-dd") : "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 24 }, { wch: 28 }, { wch: 14 }, { wch: 13 }, { wch: 14 },
        { wch: 9 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 9 }, { wch: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ansatte");
      XLSX.writeFile(wb, `ansatte-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || busy || rows.length === 0}
      className="h-9"
    >
      {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
      Eksporter Excel
    </Button>
  );
}
