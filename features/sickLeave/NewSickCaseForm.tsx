"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  employees: { id: string; fullName: string }[];
}

export function NewSickCaseForm({ employees }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const create = trpc.sickLeave.create.useMutation({
    onSuccess: (c) => router.push(`/sykefravaer/${c.id}`),
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return setError("Velg en ansatt");
    if (!startDate) return setError("Startdato er påkrevd");
    create.mutate({ employeeId, startDate, notes: notes || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="employee">Ansatt *</Label>
        <select
          id="employee"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Velg ansatt...</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.fullName}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="startDate">Første fraværsdag *</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Frister beregnes automatisk: oppfølgingsplan (dag 28), dialogmøte 1 (dag 49), dialogmøte 2 (dag 182).
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notater (valgfritt)</Label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Intern informasjon om saken"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Oppretter..." : "Opprett sak"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
