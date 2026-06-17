"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

interface SimpleLocation { id: string; name: string; }

interface Task {
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  daysOffset: number | undefined;
}

export function TemplateCreateForm({ locations }: { locations: SimpleLocation[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"ONBOARDING" | "OFFBOARDING">("ONBOARDING");
  const [locationId, setLocationId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([{ title: "", description: "", order: 0, isRequired: true, daysOffset: undefined }]);
  const [error, setError] = useState("");

  const create = trpc.onboarding.createTemplate.useMutation();

  function addTask() {
    setTasks((prev) => [...prev, { title: "", description: "", order: prev.length, isRequired: true, daysOffset: undefined }]);
  }

  function removeTask(i: number) {
    setTasks((prev) => prev.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx })));
  }

  function updateTask(i: number, field: keyof Task, value: string | boolean | number | undefined) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validTasks = tasks.filter((t) => t.title.trim());
    if (!name.trim()) { setError("Navn er påkrevd."); return; }
    try {
      const tmpl = await create.mutateAsync({
        name,
        type,
        locationId: locationId || undefined,
        tasks: validTasks,
      });
      router.push(`/admin/onboarding/maler/${tmpl.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Standard onboarding" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as "ONBOARDING" | "OFFBOARDING")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="ONBOARDING">Onboarding</option>
            <option value="OFFBOARDING">Offboarding</option>
          </select>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="location">Lokasjon (valgfritt)</Label>
          <select id="location" value={locationId} onChange={(e) => setLocationId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Alle lokasjoner</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

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
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Oppretter…" : "Opprett mal"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
      </div>
    </form>
  );
}
