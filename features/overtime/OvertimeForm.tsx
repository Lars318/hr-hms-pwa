"use client";

import { useRouter } from "next/navigation";
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
import { useToast } from "@/lib/toast";

const OVERTIME_TYPE_LABELS: Record<string, string> = {
  OVERTIME: "Overtid",
  TIME_OFF: "Avspasering",
  ON_CALL: "Beredskapsvakt",
  TRAVEL_TIME: "Reisetid",
};

const schema = z.object({
  date: z.string().min(1, "Dato er påkrevd"),
  hours: z.coerce.number().positive("Timer må være positivt").max(24, "Maks 24 timer per dag"),
  type: z.enum(["OVERTIME", "TIME_OFF", "ON_CALL", "TRAVEL_TIME"] as const),
  description: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface OvertimeFormProps {
  mode: "create" | "edit";
  existing?: {
    id: string;
    date: Date;
    hours: number;
    type: string;
    description: string | null;
  };
}

export function OvertimeForm({ mode, existing }: OvertimeFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: existing?.date ? format(new Date(existing.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hours: existing?.hours ?? 1,
      type: (existing?.type as FormValues["type"]) ?? "OVERTIME",
      description: existing?.description ?? "",
    },
  });

  const createMutation = trpc.overtime.create.useMutation({
    onSuccess: (entry) => {
      success("Registrering opprettet!");
      router.push(`/overtid/${entry.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  const updateMutation = trpc.overtime.update.useMutation({
    onSuccess: (entry) => {
      success("Registrering oppdatert!");
      router.push(`/overtid/${entry.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync(values);
    } else if (existing) {
      await updateMutation.mutateAsync({ id: existing.id, ...values });
    }
  }

  const serverError = createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Dato *</Label>
        <Input id="date" type="date" className="h-12 text-base" {...register("date")} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hours">Timer *</Label>
        <Input id="hours" type="number" step="0.5" min="0.5" max="24" className="h-12 text-base" {...register("hours")} />
        {errors.hours && <p className="text-xs text-destructive">{errors.hours.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select id="type" className="h-12 text-base" {...register("type")}>
          {Object.entries(OVERTIME_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Beskriv hva arbeidet gjaldt"
          className="text-base resize-none"
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 text-base">
          {isSubmitting ? "Lagrer…" : mode === "create" ? "Lagre" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" className="h-12 px-6" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
