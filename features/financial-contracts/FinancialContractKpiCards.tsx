"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CalendarClock, AlertTriangle, FileText } from "lucide-react";
import { formatNOK } from "./labels";

interface Summary {
  totalContractValue: number;
  totalMonthlyCost: number;
  expiringCount: number;
  contractCount: number;
}

export function FinancialContractKpiCards({
  summary,
  isLoading,
}: {
  summary?: Summary;
  isLoading?: boolean;
}) {
  const cards = [
    {
      label: "Total kontraktsverdi",
      value: summary ? formatNOK(summary.totalContractValue) : "–",
      hint: "Sum aktive",
      icon: Wallet,
      tone: "text-primary",
    },
    {
      label: "Månedlige kostnader",
      value: summary ? formatNOK(summary.totalMonthlyCost) : "–",
      hint: "Per måned",
      icon: CalendarClock,
      tone: "text-blue-600",
    },
    {
      label: "Utløper snart",
      value: summary ? String(summary.expiringCount) : "–",
      hint: `Utløper i ${new Date().getFullYear()}`,
      icon: AlertTriangle,
      tone: "text-orange-600",
    },
    {
      label: "Antall kontrakter",
      value: summary ? String(summary.contractCount) : "–",
      hint: "Aktive",
      icon: FileText,
      tone: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-muted/50" />
                  ) : (
                    c.value
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
              </div>
              <c.icon className={`h-5 w-5 shrink-0 ${c.tone}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
