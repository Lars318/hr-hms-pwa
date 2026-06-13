"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Påkrevd").max(200),
  description: z.string().max(1000).optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ActionFormProps {
  riskItemId: string;
  assessmentId: string;
  employees: Pick<Profile, "id" | "fullName">[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActionForm({ riskItemId, assessmentId, employees, onSuccess, onCancel }: ActionFormProps) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const createMutation = trpc.riskItem.createAction.useMutation({
    onSuccess: () => {
      utils.riskAssessment.byId.invalidate({ id: assessmentId });
      utils.action.list.invalidate();
      onSuccess();
    },
  });

  async function onSubmit(values: FormValues) {
    await createMutation.mutateAsync({
      riskItemId,
      title: values.title,
      description: values.description,
      assignedToId: values.assignedToId || undefined,
      priority: values.priority,
      dueDate: values.dueDate || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="action-title">Tittel *</Label>
        <Input id="action-title" {...register("title")} placeholder="Beskriv tiltaket kort…" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="action-desc">Beskrivelse</Label>
        <Textarea id="action-desc" rows={2} placeholder="Detaljer om tiltaket…" {...register("description")} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="action-assigned">Ansvarlig</Label>
          <Select id="action-assigned" {...register("assignedToId")}>
            <option value="">Ingen</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="action-priority">Prioritet</Label>
          <Select id="action-priority" {...register("priority")}>
            <option value="LOW">Lav</option>
            <option value="MEDIUM">Middels</option>
            <option value="HIGH">Høy</option>
            <option value="CRITICAL">Kritisk</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="action-due">Frist</Label>
          <Input id="action-due" type="date" {...register("dueDate")} />
        </div>
      </div>

      {createMutation.error && <p className="text-sm text-destructive">{createMutation.error.message}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isSubmitting}>{isSubmitting ? "Lagrer…" : "Opprett tiltak"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Avbryt</Button>
      </div>
    </form>
  );
}
