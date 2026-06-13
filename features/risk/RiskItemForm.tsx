"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RiskMatrix } from "./RiskMatrix";
import { RiskLevelBadge } from "./RiskLevelBadge";
import { calcRiskScore, calcRiskLevel } from "@/lib/risk";
import type { Profile } from "@prisma/client";

const schema = z.object({
  hazard: z.string().min(1, "Påkrevd").max(500),
  consequence: z.string().min(1, "Påkrevd").max(500),
  likelihood: z.coerce.number().int().min(1).max(5),
  impact: z.coerce.number().int().min(1).max(5),
  existingMeasures: z.string().max(1000).optional(),
  proposedMeasures: z.string().max(1000).optional(),
  responsibleId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RiskItemFormProps {
  assessmentId: string;
  employees: Pick<Profile, "id" | "fullName">[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function RiskItemForm({ assessmentId, employees, onSuccess, onCancel }: RiskItemFormProps) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { likelihood: 3, impact: 3 },
  });

  const likelihood = Number(watch("likelihood") ?? 3);
  const impact = Number(watch("impact") ?? 3);
  const previewScore = calcRiskScore(likelihood, impact);
  const previewLevel = calcRiskLevel(previewScore);

  const createMutation = trpc.riskItem.create.useMutation({
    onSuccess: () => {
      utils.riskAssessment.byId.invalidate({ id: assessmentId });
      onSuccess();
    },
  });

  async function onSubmit(values: FormValues) {
    await createMutation.mutateAsync({
      assessmentId,
      ...values,
      responsibleId: values.responsibleId || undefined,
      dueDate: values.dueDate || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="hazard">Fare/Hendelse *</Label>
          <Textarea id="hazard" rows={2} placeholder="Beskriv faren…" {...register("hazard")} />
          {errors.hazard && <p className="text-xs text-destructive">{errors.hazard.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="consequence">Konsekvens *</Label>
          <Textarea id="consequence" rows={2} placeholder="Hva kan skje?" {...register("consequence")} />
          {errors.consequence && <p className="text-xs text-destructive">{errors.consequence.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="likelihood">Sannsynlighet (1–5)</Label>
            <Input id="likelihood" type="number" min={1} max={5} {...register("likelihood")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="impact">Konsekvensgrad (1–5)</Label>
            <Input id="impact" type="number" min={1} max={5} {...register("impact")} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Score: {previewScore}</span>
            <RiskLevelBadge level={previewLevel} />
          </div>
        </div>
        <RiskMatrix likelihood={likelihood} impact={impact} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="existingMeasures">Eksisterende tiltak</Label>
          <Textarea id="existingMeasures" rows={2} placeholder="Hva er allerede på plass?" {...register("existingMeasures")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="proposedMeasures">Foreslåtte tiltak</Label>
          <Textarea id="proposedMeasures" rows={2} placeholder="Hva bør gjøres?" {...register("proposedMeasures")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="responsibleId">Ansvarlig</Label>
          <Select id="responsibleId" {...register("responsibleId")}>
            <option value="">Ingen</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dueDate">Frist</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      {createMutation.error && <p className="text-sm text-destructive">{createMutation.error.message}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Lagrer…" : "Legg til risikopunkt"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
      </div>
    </form>
  );
}
