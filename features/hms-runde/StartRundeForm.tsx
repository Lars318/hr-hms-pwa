"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  templates: { id: string; title: string }[];
  locations: { id: string; name: string }[];
}

export function StartRundeForm({ templates, locations }: Props) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const start = trpc.inspection.startRecord.useMutation({
    onSuccess: (record) => router.push(`/hms-runde/${record.id}`),
    onError: (e) => setError(e.message),
  });

  const selectedTemplate = templates.find((t) => t.id === templateId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) return setError("Velg en mal");
    const finalTitle = title.trim() || (selectedTemplate?.title ?? "HMS-runde");
    start.mutate({ templateId, locationId: locationId || undefined, title: finalTitle });
  }

  if (!templates.length) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Ingen aktive sjekkliste-maler. Be en administrator opprette en mal først.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="template">Sjekkliste-mal</Label>
        <select
          id="template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {locations.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="location">Lokasjon (valgfritt)</Label>
          <select
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— Velg lokasjon —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Tittel (valgfritt)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={selectedTemplate?.title ?? "HMS-runde"}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={start.isLoading}>
        {start.isLoading ? "Starter..." : "Start runde"}
      </Button>
    </form>
  );
}
