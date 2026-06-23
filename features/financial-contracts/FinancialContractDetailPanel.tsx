"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Download, Ban, FileText } from "lucide-react";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE,
  formatNOK,
  formatDate,
} from "./labels";

type Tab = "oversikt" | "detaljer" | "dokumenter" | "historikk";

const TABS: { key: Tab; label: string }[] = [
  { key: "oversikt", label: "Oversikt" },
  { key: "detaljer", label: "Detaljer" },
  { key: "dokumenter", label: "Dokumenter" },
  { key: "historikk", label: "Historikk" },
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function FinancialContractDetailPanel({
  contractId,
  onClose,
}: {
  contractId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("oversikt");
  const utils = trpc.useUtils();
  const { data: c, isLoading } = trpc.financialContract.getById.useQuery({
    id: contractId,
  });

  const getUrl = trpc.financialContract.getAttachmentUrl.useMutation({
    onSuccess: ({ signedUrl }) => {
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    },
  });

  const terminate = trpc.financialContract.terminate.useMutation({
    onSuccess: () => {
      utils.financialContract.getById.invalidate({ id: contractId });
      utils.financialContract.list.invalidate();
      utils.financialContract.getSummary.invalidate();
    },
  });

  return (
    <div className="flex h-full flex-col bg-card border-l">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">
            {isLoading ? "Laster…" : c?.name}
          </h2>
          {c && (
            <span
              className={cn(
                "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                STATUS_BADGE[c.status]
              )}
            >
              {STATUS_LABELS[c.status]}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 px-2 py-2.5 font-medium transition-colors",
              tab === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!c ? (
          <p className="text-sm text-muted-foreground">Laster kontrakt…</p>
        ) : tab === "oversikt" ? (
          <div className="space-y-1">
            <Field label="Leverandør" value={c.supplierName} />
            <Field label="Type" value={TYPE_LABELS[c.type]} />
            <Field
              label="Senter"
              value={c.location?.name ?? c.centerName ?? "–"}
            />
            <Field label="Månedlig" value={formatNOK(c.monthlyAmount)} />
            <Field label="Årlig" value={formatNOK(c.annualAmount)} />
            <Field label="Total verdi" value={formatNOK(c.totalValue)} />
            <Field label="Startdato" value={formatDate(c.startDate)} />
            <Field label="Sluttdato" value={formatDate(c.endDate)} />
          </div>
        ) : tab === "detaljer" ? (
          <div className="space-y-1">
            <Field label="Kontraktsnummer" value={c.contractNumber ?? "–"} />
            <Field label="Areal (m²)" value={c.areaSqm ?? "–"} />
            <Field
              label="Varighet (mnd)"
              value={c.durationMonths ?? "–"}
            />
            <Field
              label="Oppsigelse (mnd)"
              value={c.noticePeriodMonths ?? "–"}
            />
            <Field
              label="Fornyelse"
              value={c.renewalOption ? "Ja" : "Nei"}
            />
            <Field label="Valuta" value={c.currency} />
            <Field label="Opprettet av" value={c.createdBy.fullName} />
            <Field label="Opprettet" value={formatDate(c.createdAt)} />
            {c.description && (
              <div className="pt-3">
                <p className="text-xs text-muted-foreground mb-1">Beskrivelse</p>
                <p className="text-sm whitespace-pre-wrap">{c.description}</p>
              </div>
            )}
            {c.notes && (
              <div className="pt-3">
                <p className="text-xs text-muted-foreground mb-1">Notater</p>
                <p className="text-sm whitespace-pre-wrap">{c.notes}</p>
              </div>
            )}
            {c.status !== "TERMINATED" && (
              <div className="pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={terminate.isPending}
                  onClick={() => terminate.mutate({ id: c.id })}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Avslutt kontrakt
                </Button>
              </div>
            )}
          </div>
        ) : tab === "dokumenter" ? (
          <div className="space-y-2">
            {c.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen vedlegg.</p>
            ) : (
              c.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{a.fileName}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={getUrl.isPending}
                    onClick={() => getUrl.mutate({ attachmentId: a.id })}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Historikk kommer i en senere versjon.
          </p>
        )}
      </div>
    </div>
  );
}
