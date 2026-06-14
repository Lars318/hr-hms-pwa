"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

const HAZARD_OPTIONS = [
  "Brannfarlig",
  "Eksplosiv",
  "Oksiderende",
  "Gass under trykk",
  "Helseskadelig",
  "Giftig",
  "Etsende",
  "Miljøfarlig",
  "Alvorlig helsefare",
];

interface Props {
  locations: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  initial?: {
    id: string;
    name: string;
    supplier: string | null;
    description: string | null;
    hazardSymbols: string[];
    protectiveEquipment: string | null;
    riskNote: string | null;
    storageInstructions: string | null;
    sdsReference: string | null;
    reviewDate: Date | null;
    expiresAt: Date | null;
    locationId: string | null;
    departmentId: string | null;
  };
}

function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().substring(0, 10);
}

export function ChemicalForm({ locations, departments, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    supplier: initial?.supplier ?? "",
    description: initial?.description ?? "",
    hazardSymbols: initial?.hazardSymbols ?? [] as string[],
    protectiveEquipment: initial?.protectiveEquipment ?? "",
    riskNote: initial?.riskNote ?? "",
    storageInstructions: initial?.storageInstructions ?? "",
    sdsReference: initial?.sdsReference ?? "",
    reviewDate: toDateInput(initial?.reviewDate),
    expiresAt: toDateInput(initial?.expiresAt),
    locationId: initial?.locationId ?? "",
    departmentId: initial?.departmentId ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleHazard(symbol: string) {
    setForm((f) => ({
      ...f,
      hazardSymbols: f.hazardSymbols.includes(symbol)
        ? f.hazardSymbols.filter((h) => h !== symbol)
        : [...f.hazardSymbols, symbol],
    }));
  }

  const create = trpc.chemical.create.useMutation({
    onSuccess: (data) => router.push(`/kjemikalier/${data.id}`),
    onError: (e) => setError(e.message),
  });

  const update = trpc.chemical.update.useMutation({
    onSuccess: () => router.push(`/kjemikalier/${initial!.id}`),
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name.trim(),
      supplier: form.supplier.trim() || undefined,
      description: form.description.trim() || undefined,
      hazardSymbols: form.hazardSymbols,
      protectiveEquipment: form.protectiveEquipment.trim() || undefined,
      riskNote: form.riskNote.trim() || undefined,
      storageInstructions: form.storageInstructions.trim() || undefined,
      sdsReference: form.sdsReference.trim() || undefined,
      reviewDate: form.reviewDate ? new Date(form.reviewDate).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      locationId: form.locationId || undefined,
      departmentId: form.departmentId || undefined,
    };
    if (isEdit) {
      update.mutate({ id: initial!.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Produktnavn *</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="f.eks. Klorenheter 10%"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Leverandør</label>
          <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)}
            placeholder="f.eks. Diversey"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Beskrivelse</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={2} placeholder="Bruksområde og generell info..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {/* Faremerking */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Faremerking (GHS)</label>
        <div className="flex flex-wrap gap-2">
          {HAZARD_OPTIONS.map((h) => (
            <button key={h} type="button" onClick={() => toggleHazard(h)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                form.hazardSymbols.includes(h)
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "border-input hover:bg-accent"
              }`}>
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Verneutstyr</label>
        <input value={form.protectiveEquipment} onChange={(e) => set("protectiveEquipment", e.target.value)}
          placeholder="f.eks. Hansker, vernebriller, maske"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Risikovurdering (kortfattet)</label>
        <textarea value={form.riskNote} onChange={(e) => set("riskNote", e.target.value)}
          rows={2} placeholder="Kort vurdering av risiko ved bruk..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Oppbevaringsinstruksjoner</label>
        <input value={form.storageInstructions} onChange={(e) => set("storageInstructions", e.target.value)}
          placeholder="f.eks. Kjølig, tørt sted. Unngå sollys."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Sikkerhetsdatablad (SDS) – referanse/lenke</label>
        <input value={form.sdsReference} onChange={(e) => set("sdsReference", e.target.value)}
          placeholder="URL til SDS-dokument eller referansenummer"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Revisjonsdato</label>
          <input type="date" value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Utløpsdato</label>
          <input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Lokasjon</label>
          <select value={form.locationId} onChange={(e) => set("locationId", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Alle lokasjoner</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Avdeling</label>
          <select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Ingen avdeling</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer..." : isEdit ? "Oppdater" : "Opprett"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
      </div>
    </form>
  );
}
