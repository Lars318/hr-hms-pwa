"use client";

import { useRef, useState } from "react";
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
import { Loader2, Sparkles, Upload, FileText } from "lucide-react";
import { TYPE_OPTIONS, STATUS_OPTIONS } from "./labels";
import type {
  FinancialContractType,
  FinancialContractStatus,
} from "@prisma/client";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: { id: string; name: string }[];
}

interface FormState {
  name: string;
  type: FinancialContractType;
  supplierName: string;
  locationId: string;
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
}

const EMPTY: FormState = {
  name: "",
  type: "RENT",
  supplierName: "",
  locationId: "",
  status: "DRAFT",
  startDate: "",
  endDate: "",
  monthlyAmount: "",
  annualAmount: "",
  totalValue: "",
  areaSqm: "",
  noticePeriodMonths: "",
  renewalOption: false,
  description: "",
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

export function NewFinancialContractDialog({
  open,
  onOpenChange,
  locations,
}: Props) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploadedPath, setUploadedPath] = useState<string | undefined>();
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getUploadUrl = trpc.financialContract.getUploadUrl.useMutation();
  const extract = trpc.financialContract.extractFromUpload.useMutation();
  const create = trpc.financialContract.create.useMutation({
    onSuccess: () => {
      utils.financialContract.list.invalidate();
      utils.financialContract.getSummary.invalidate();
      reset();
      onOpenChange(false);
    },
    onError: (e) => setError(e.message),
  });

  function reset() {
    setForm(EMPTY);
    setUploadedPath(undefined);
    setUploadedFile(undefined);
    setAiWarnings([]);
    setError(null);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Kun PDF-filer støttes.");
      return;
    }
    setUploading(true);
    setError(null);
    setAiWarnings([]);
    try {
      const { signedUrl, filePath } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        mimeType: "application/pdf",
        sizeBytes: file.size,
      });
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!res.ok) throw new Error("Opplasting feilet.");
      setUploadedPath(filePath);
      setUploadedFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved opplasting.");
    } finally {
      setUploading(false);
    }
  }

  async function runAi() {
    if (!uploadedPath) return;
    setExtracting(true);
    setError(null);
    setAiWarnings([]);
    try {
      const ex = await extract.mutateAsync({ filePath: uploadedPath });
      // Match AI-ens lokasjonstekst (f.eks. "Puls Kantor AS") mot et Puls-senter.
      const loc = ex.locationName?.toLowerCase();
      const matchedCenter = loc
        ? PULS_LOCATIONS.find((c) => loc.includes(c.toLowerCase()) || c.toLowerCase().includes(loc))
        : undefined;
      // Status utledes av sluttdato: forfalt → EXPIRED, < 90 dager → EXPIRES_SOON, ellers ACTIVE.
      const derivedStatus = ((): FinancialContractStatus | undefined => {
        if (!ex.endDate) return undefined;
        const end = new Date(ex.endDate);
        if (isNaN(end.getTime())) return undefined;
        const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
        if (days < 0) return "EXPIRED";
        if (days <= 90) return "EXPIRES_SOON";
        return "ACTIVE";
      })();
      // Navn: bruk AI-navnet, men la filnavnet vinne hvis det har et
      // avtalenummer (f.eks. "#1075") som AI-navnet mangler.
      const fileBase = uploadedFile?.name.replace(/\.pdf$/i, "").trim();
      const aiName = ex.name?.trim();
      const hasNum = (s?: string) => !!s && /\d/.test(s);
      const bestName = hasNum(fileBase) && !hasNum(aiName) ? fileBase : aiName || fileBase;
      setForm((f) => ({
        ...f,
        name: bestName ?? f.name,
        supplierName: ex.supplierName ?? f.supplierName,
        type: (ex.type as FinancialContractType) ?? f.type,
        status: derivedStatus ?? f.status,
        locationId: matchedCenter ?? f.locationId,
        startDate: ex.startDate ?? f.startDate,
        endDate: ex.endDate ?? f.endDate,
        monthlyAmount:
          ex.monthlyAmount != null ? String(ex.monthlyAmount) : f.monthlyAmount,
        annualAmount:
          ex.annualAmount != null ? String(ex.annualAmount) : f.annualAmount,
        totalValue:
          ex.totalValue != null ? String(ex.totalValue) : f.totalValue,
        areaSqm: ex.areaSqm != null ? String(ex.areaSqm) : f.areaSqm,
        noticePeriodMonths:
          ex.noticePeriodMonths != null
            ? String(ex.noticePeriodMonths)
            : f.noticePeriodMonths,
        renewalOption: ex.renewalOption ?? f.renewalOption,
        description: ex.summary ?? f.description,
      }));
      if (ex.warnings?.length) setAiWarnings(ex.warnings);
      else if (Object.keys(ex).length === 0)
        setAiWarnings(["AI-ekstraksjon er ikke aktivert på serveren."]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI-ekstraksjon feilet.");
    } finally {
      setExtracting(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.supplierName.trim()) {
      setError("Navn og leverandør er påkrevd.");
      return;
    }
    // Puls-sentrene er hardkodede navn (ikke ekte Location-rader) → lagres som
    // centerName. Reelle lokasjoner fra `locations` lagres som locationId.
    const isPulsCenter = PULS_LOCATIONS.includes(form.locationId);
    create.mutate({
      name: form.name.trim(),
      type: form.type,
      supplierName: form.supplierName.trim(),
      locationId: !isPulsCenter && form.locationId ? form.locationId : null,
      centerName: isPulsCenter ? form.locationId : null,
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
      currency: "NOK",
      ...(uploadedPath && uploadedFile
        ? {
            attachment: {
              fileName: uploadedFile.name,
              filePath: uploadedPath,
              mimeType: "application/pdf",
              sizeBytes: uploadedFile.size,
            },
          }
        : {}),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ny kontrakt</DialogTitle>
          <DialogDescription>
            Last opp en PDF og la AI fylle ut feltene, eller registrer manuelt.
          </DialogDescription>
        </DialogHeader>

        {/* AI / opplasting */}
        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              {uploadedFile ? "Bytt PDF" : "Last opp PDF"}
            </Button>
            {uploadedPath && (
              <Button
                type="button"
                size="sm"
                disabled={extracting}
                onClick={runAi}
              >
                {extracting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                Les kontrakt med AI
              </Button>
            )}
            {uploadedFile && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {uploadedFile.name}
              </span>
            )}
          </div>
          {aiWarnings.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-orange-600">
              {aiWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Navn *">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="Leverandør *">
              <Input
                value={form.supplierName}
                onChange={(e) => set("supplierName", e.target.value)}
                required
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) =>
                  set("type", e.target.value as FinancialContractType)
                }
              >
                {TYPE_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as FinancialContractStatus)
                }
              >
                {STATUS_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Senter">
              <Select
                value={form.locationId}
                onChange={(e) => set("locationId", e.target.value)}
              >
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
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="Sluttdato">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Field>
            <Field label="Månedlig beløp (NOK)">
              <Input
                inputMode="decimal"
                value={form.monthlyAmount}
                onChange={(e) => set("monthlyAmount", e.target.value)}
              />
            </Field>
            <Field label="Årlig beløp (NOK)">
              <Input
                inputMode="decimal"
                value={form.annualAmount}
                onChange={(e) => set("annualAmount", e.target.value)}
              />
            </Field>
            <Field label="Total verdi (NOK)">
              <Input
                inputMode="decimal"
                value={form.totalValue}
                onChange={(e) => set("totalValue", e.target.value)}
              />
            </Field>
            {AREA_TYPES.includes(form.type) && (
              <Field label="Areal (m²)">
                <Input
                  inputMode="decimal"
                  value={form.areaSqm}
                  onChange={(e) => set("areaSqm", e.target.value)}
                />
              </Field>
            )}
            <Field label="Oppsigelse (mnd)">
              <Input
                inputMode="numeric"
                value={form.noticePeriodMonths}
                onChange={(e) => set("noticePeriodMonths", e.target.value)}
              />
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Opprett kontrakt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
