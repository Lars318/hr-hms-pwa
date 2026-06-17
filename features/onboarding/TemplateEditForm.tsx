"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

interface SimpleLocation { id: string; name: string; }
interface Task { id?: string; title: string; description: string | null; order: number; isRequired: boolean; daysOffset: number | null; }
interface Template { id: string; name: string; type: string; locationId: string | null; tasks: Task[]; }

export function TemplateEditForm({ template, locations }: { template: Template; locations: SimpleLocation[] }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [locationId, setLocationId] = useState(template.locationId ?? "");
  const [tasks, setTasks] = useState(template.tasks.map((t) => ({ title: t.title, description: t.description ?? "", order: t.order, isRequired: t.isRequired, daysOffset: t.daysOffset ?? undefined })));
  const [error, setError] = useState("");

  const update = trpc.onboarding.updateTemplate.useMutation();

  function addTask() {
    setTasks((prev) => [...prev, { title: "", description: "", order: prev.length, isRequired: true, daysOffset: undefined }]);
  }

  function removeTask(i: number) {
    setTasks((prev) => prev.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx })));
  }

  function updateTask(i: number, field: string, value: string | boolean | number | undefined) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validTasks = tasks.filter((t) => t.title.trim());
    try {
      await update.mutateAsync({
        id: template.id,
        name,
        locationId: locationId || null,
        tasks: validTasks,
      });
      router.push("/admin/onboarding/maler");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  }

  async function handleDeactivate() {
    await update.mutateAsync({ id: template.id, isActive: false });
    router.push("/admin/onboarding/maler");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {locations.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="location">Lokasjon</Label>
            <select id="location" value={locationId} onChange={(e) => setLocationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Alle lokasjoner</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Oppgaver</Label>
          <Button type="button" size="sm" variant="outline" onClick={addTask}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Legg til oppgave
          </Button>
        </div>
        {tasks.map((task, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
              <Input placeholder="Oppgavetittel *" value={task.title} onChange={(e) => updateTask(i, "title", e.target.value)} className="flex-1 h-8" />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => removeTask(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input placeholder="Beskrivelse (valgfritt)" value={task.description} onChange={(e) => updateTask(i, "description", e.target.value)} className="h-8 ml-7" />
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Ingen oppgaver lagt til.</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Lagrer…" : "Lagre endringer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={handleDeactivate} disabled={update.isPending}>
          Deaktiver mal
        </Button>
      </div>
    </form>
  );
}
