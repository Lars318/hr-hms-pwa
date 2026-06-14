"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

const CATEGORIES = [
  { value: "HARASSMENT", label: "Trakassering" },
  { value: "DISCRIMINATION", label: "Diskriminering" },
  { value: "SAFETY", label: "Sikkerhetsbrudd / HMS" },
  { value: "FINANCIAL_MISCONDUCT", label: "Økonomiske misligheter" },
  { value: "ETHICS", label: "Uetisk atferd" },
  { value: "RETALIATION", label: "Gjengjeldelse" },
  { value: "OTHER", label: "Annet" },
] as const;

const SEVERITIES = [
  { value: "LOW", label: "Lav", desc: "Liten konsekvens, kan vente" },
  { value: "MEDIUM", label: "Medium", desc: "Bør håndteres relativt snart" },
  { value: "HIGH", label: "Høy", desc: "Alvorlig – krever rask behandling" },
  { value: "CRITICAL", label: "Kritisk", desc: "Umiddelbar handling påkrevd" },
] as const;

interface Props {
  locations: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}

export function NewCaseForm({ locations, departments }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "HARASSMENT" as typeof CATEGORIES[number]["value"],
    severity: "MEDIUM" as typeof SEVERITIES[number]["value"],
    isAnonymous: false,
    isConfidential: true,
    locationId: "",
    departmentId: "",
  });
  const [error, setError] = useState<string | null>(null);

  const create = trpc.whistleblowing.create.useMutation({
    onSuccess: (data) => {
      router.push(`/varsling/${data.id}`);
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({
      title: form.title,
      description: form.description,
      category: form.category,
      severity: form.severity,
      isAnonymous: form.isAnonymous,
      isConfidential: form.isConfidential,
      locationId: form.locationId || undefined,
      departmentId: form.departmentId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Tittel */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="title">
          Tittel <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Kort beskrivelse av forholdet"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      {/* Kategori */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="category">
          Kategori <span className="text-destructive">*</span>
        </label>
        <select
          id="category"
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Alvorlighet */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Alvorlighet <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITIES.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, severity: value }))}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors min-h-[56px] ${
                form.severity === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Beskrivelse */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="description">
          Beskrivelse <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          required
          rows={6}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="Beskriv det kritikkverdige forholdet så detaljert som mulig. Inkluder tidspunkt, involverte parter (uten å navngi dem unødvendig) og konsekvenser."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      {/* Lokasjon */}
      {locations.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="location">
            Lokasjon (valgfritt)
          </label>
          <select
            id="location"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.locationId}
            onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
          >
            <option value="">Ingen spesifik lokasjon</option>
            {locations.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Avdeling */}
      {departments.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="department">
            Avdeling (valgfritt)
          </label>
          <select
            id="department"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
          >
            <option value="">Ingen spesifik avdeling</option>
            {departments.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Konfidensialitet */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border"
            checked={form.isConfidential}
            onChange={(e) => setForm((f) => ({ ...f, isConfidential: e.target.checked }))}
          />
          <div>
            <span className="text-sm font-medium">Konfidensiell sak</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kun HR og administrator kan se saken. Anbefalt for de fleste saker.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border"
            checked={form.isAnonymous}
            onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
          />
          <div>
            <span className="text-sm font-medium">Send som anonym</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Navnet ditt vil ikke vises i saksbildet.
            </p>
          </div>
        </label>
      </div>

      {/* Anonym-advarsel */}
      {form.isAnonymous && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Merk:</strong> Anonym innsending i denne interne piloten betyr at navnet ditt
            ikke vises i saksbildet, men tekniske logger kan fortsatt finnes av administrator.
            Full anonym ekstern varslingskanal er ikke implementert ennå.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={create.isPending}
          className="min-h-[44px]"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {create.isPending ? "Sender…" : "Send varslingssak"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px]"
          onClick={() => router.back()}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}
