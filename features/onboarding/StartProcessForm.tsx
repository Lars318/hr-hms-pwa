"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Profile { id: string; fullName: string }
interface Template { id: string; name: string; type: string }

interface Props {
  profiles: Profile[];
  templates: Template[];
  hrProfiles: Profile[];
}

interface TaskDraft {
  title: string;
  description: string;
  isRequired: boolean;
  dueDate: string;
  order: number;
}

export function StartProcessForm({ profiles, templates, hrProfiles }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<"ONBOARDING" | "OFFBOARDING">("ONBOARDING");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [templateId, setTemplateId] = useState("");
  const [responsibleHrId, setResponsibleHrId] = useState("");
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = templates.filter((t) => t.type === type);

  const addTask = () => setTasks((prev) => [...prev, {
    title: "", description: "", isRequired: true, dueDate: "", order: prev.length,
  }]);

  const removeTask = (i: number) => setTasks((prev) => prev.filter((_, idx) => idx !== i));

  const updateTask = (i: number, field: keyof TaskDraft, value: string | boolean | number) =>
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

  const start = trpc.onboarding.startProcess.useMutation({
    onSuccess: (p) => router.push(`/admin/onboarding/${p.id}`),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeId) { setError("Velg ansatt"); return; }
    start.mutate({
      employeeId,
      type,
      startDate,
      templateId: templateId || undefined,
      responsibleHrId: responsibleHrId || undefined,
      notes: notes.trim() || undefined,
      tasks: tasks.length > 0
        ? tasks.map((t, i) => ({
            title: t.title,
            description: t.description || undefined,
            order: i,
            isRequired: t.isRequired,
            dueDate: t.dueDate || undefined,
          }))
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Ansatt *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Velg ansatt...</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as "ONBOARDING" | "OFFBOARDING")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="ONBOARDING">Onboarding</option>
            <option value="OFFBOARDING">Offboarding</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Startdato *</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mal (valgfri)</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Ingen mal</option>
            {filteredTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Ansvarlig HR (valgfri)</label>
          <select value={responsibleHrId} onChange={(e) => setResponsibleHrId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Ikke tildelt</option>
            {hrProfiles.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notat (valgfri)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      {!templateId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Egne oppgaver</p>
            <Button type="button" variant="ghost" size="sm" onClick={addTask}>
              <Plus className="h-4 w-4 mr-1" />Legg til oppgave
            </Button>
          </div>
          {tasks.map((task, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2">
                <input value={task.title} onChange={(e) => updateTask(i, "title", e.target.value)}
                  placeholder="Oppgavetittel *"
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTask(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-3 items-center">
                <input type="date" value={task.dueDate} onChange={(e) => updateTask(i, "dueDate", e.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={task.isRequired}
                    onChange={(e) => updateTask(i, "isRequired", e.target.checked)} />
                  Obligatorisk
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={start.isPending}>
        {start.isPending ? "Starter..." : "Start prosess"}
      </Button>
    </form>
  );
}
