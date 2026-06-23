"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TYPE_OPTIONS, STATUS_OPTIONS } from "./labels";

const PULS_LOCATIONS = [
  "Puls Bøleråsen",
  "Puls Greverud",
  "Puls Kantor",
  "Puls Langhus",
  "Puls Marikollen",
  "Puls Tomter",
  "Puls Trollåsen",
];

const AREA_TYPES: FinancialContractType[] = ["HUSLEIE", "OTHER"];
import type { FinancialContractType, FinancialContractStatus } from "@prisma/client";

interface ContractData {
  id: string;
  name: string;
  contractNumber: string | null;
  type: FinancialContractType;
  supplierName: string;
  locationId: string | null;
  centerName: string | null;
  status: FinancialContractStatus;
  startDate: string | Date | null;
  endDate: string | Date | null;
  monthlyAmount: number | null;
  annualAmount: number | null;
  totalValue: number | null;
  areaSqm: number | null;
  noticePeriodMonths: number | null;
  renewalOption: boolean;
  description: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractData;
  locations: { id: string; name: string }[];
}

interface FormState {
  name: string;
  contractNumber: string;
  type: FinancialContractType;
  supplierName: string;
  locationId: string;
  centerName: string;
  status: FinancialContractStatus;
  startDate: string;
  endDate: string;
  monthlyAmount: string;
  annualAmount: string;
  totalValue: string;
  areaSqm: string;
  noticePeriodMonths: string;
  renewalOption: boolean;
  description: string;
  notes: string;
}

function toDateStr(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toISOString().slice(0, 10);
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

function contractToForm(c: ContractData): FormState {
  return {
    name: c.name,
    contractNumber: c.contractNumber ?? "",
    type: c.type,
    supplierName: c.supplierName,
    locationId: c.locationId ?? "",
    centerName: c.centerName ?? "",
    status: c.status,
    startDate: toDateStr(c.startDate),
    endDate: toDateStr(c.endDate),
    monthlyAmount: c.monthlyAmount != null ? String(c.monthlyAmount) : "",
    annualAmount: c.annualAmount != null ? String(c.annualAmount) : "",
    totalValue: c.totalValue != null ? String(c.totalValue) : "",
    areaSqm: c.areaSqm != null ? String(c.areaSqm) : "",
    noticePeriodMonths: c.noticePeriodMonths != null ? String(c.noticePeriodMonths) : "",
    renewalOption: c.renewalOption,
    description: c.description ?? "",
    notes: c.notes ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export function EditFinancialContractDialog({ open, onOpenChange, contract, locations }: Props) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(() => contractToForm(contract));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(contractToForm(contract));
      setError(null);
    }
  }, [open, contract]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const update = trpc.financialContract.update.useMutation({
    onSuccess: () => {
      utils.financialContract.getById.invalidate({ id: contract.id });
      utils.financialContract.list.invalidate();
      utils.financialContract.getSummary.invalidate();
      onOpenChange(false);
    },
    onError: (e) => setError(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.supplierName.trim()) {
      setError("Navn og leverandør er påkrevd.");
      return;
    }
    update.mutate({
      id: contract.id,
      name: form.name.trim(),
      contractNumber: form.contractNumber || null,
      type: form.type,
      supplierName: form.supplierName.trim(),
      locationId: form.locationId || null,
      centerName: null,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      monthlyAmount: numOrNull(form.monthlyAmount),
      annualAmount: numOrNull(form.annualAmount),
      totalValue: numOrNull(form.totalValue),
      areaSqm: numOrNull(form.areaSqm),
      noticePeriodMonths: numOrNull(form.noticePeriodMonths)
        ? Math.round(numOrNull(form.noticePeriodMonths)!)
        : null,
      renewalOption: form.renewalOption,
      description: form.description || null,
      notes: form.notes || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rediger kontrakt</DialogTitle>
          <DialogDescription>Oppdater kontraktsdetaljer. Alle endringer logges.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Navn *">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Leverandør *">
              <Input value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} required />
            </Field>
            <Field label="Kontraktsnummer">
              <Input value={form.contractNumber} onChange={(e) => set("contractNumber", e.target.value)} />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set("type", e.target.value as FinancialContractType)}>
                {TYPE_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as FinancialContractStatus)}>
                {STATUS_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Senter">
              <Select value={form.locationId} onChange={(e) => set("locationId", e.target.value)}>
                <option value="">– velg senter –</option>
                <optgroup label="Puls-sentre">
                  {PULS_LOCATIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </optgroup>
                {locations.length > 0 && (
                  <optgroup label="Andre lokasjoner">
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </Field>
            <Field label="Startdato">
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="Sluttdato">
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
            <Field label="Månedlig beløp (NOK)">
              <Input inputMode="decimal" value={form.monthlyAmount} onChange={(e) => set("monthlyAmount", e.target.value)} />
            </Field>
            <Field label="Årlig beløp (NOK)">
              <Input inputMode="decimal" value={form.annualAmount} onChange={(e) => set("annualAmount", e.target.value)} />
            </Field>
            <Field label="Total verdi (NOK)">
              <Input inputMode="decimal" value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} />
            </Field>
            {AREA_TYPES.includes(form.type) && (
              <Field label="Areal (m²)">
                <Input inputMode="decimal" value={form.areaSqm} onChange={(e) => set("areaSqm", e.target.value)} />
              </Field>
            )}
            <Field label="Oppsigelse (mnd)">
              <Input inputMode="numeric" value={form.noticePeriodMonths} onChange={(e) => set("noticePeriodMonths", e.target.value)} />
            </Field>
            <Field label="Fornyelse">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.renewalOption}
                  onChange={(e) => set("renewalOption", e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Automatisk fornyelse
              </label>
            </Field>
          </div>

          <Field label="Beskrivelse">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>

          <Field label="Notater (intern bruk)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre endringer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
