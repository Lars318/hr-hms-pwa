"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const CATEGORIES = [
  "Førstehjelp",
  "Hjertestarter",
  "Brannvern",
  "Renhold/kjemikalier",
  "HMS-rutiner",
  "Avviksrapportering",
  "Varsling av kritikkverdige forhold",
  "Verneombudopplæring",
  "Leder-HMS",
  "Personvern/GDPR",
  "Annet",
];

interface Props {
  locations: { id: string; name: string }[];
}

export function NewCourseForm({ locations }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Førstehjelp",
    customCategory: "",
    isRequired: false,
    validityMonths: "",
    locationId: "",
  });
  const [error, setError] = useState<string | null>(null);

  const create = trpc.training.createCourse.useMutation({
    onSuccess: (data) => router.push(`/opplaering/${data.id}`),
    onError: (e) => setError(e.message),
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const category = form.category === "Annet" ? form.customCategory.trim() : form.category;
    if (!category) { setError("Skriv inn kategori"); return; }
    create.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category,
      isRequired: form.isRequired,
      validityMonths: form.validityMonths ? parseInt(form.validityMonths) : undefined,
      locationId: form.locationId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium">Kursnavn *</label>
        <input
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="f.eks. Førstehjelp grunnkurs"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Kategori *</label>
        <select
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {form.category === "Annet" && (
          <input
            required
            value={form.customCategory}
            onChange={(e) => set("customCategory", e.target.value)}
            placeholder="Skriv inn kategori"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Beskrivelse</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Valgfri beskrivelse av kurset..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Gyldighet (måneder)</label>
          <input
            type="number"
            min={1}
            value={form.validityMonths}
            onChange={(e) => set("validityMonths", e.target.value)}
            placeholder="f.eks. 24 — blank = ingen utløp"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Lokasjon (valgfri)</label>
          <select
            value={form.locationId}
            onChange={(e) => set("locationId", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle lokasjoner</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isRequired"
          type="checkbox"
          checked={form.isRequired}
          onChange={(e) => set("isRequired", e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <label htmlFor="isRequired" className="text-sm">
          Obligatorisk opplæring
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Lagrer..." : "Opprett kurs"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
