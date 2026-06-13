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
import type { RiskAssessment, Department } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Tittel er påkrevd").max(200),
  description: z.string().max(2000).optional(),
  departmentId: z.string().optional(),
  reviewDate: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "REVIEW", "CLOSED"]).optional(),
});

type FormValues = z.infer<typeof schema>;

interface RiskAssessmentFormProps {
  mode: "create" | "edit";
  assessment?: RiskAssessment;
  departments: Pick<Department, "id" | "name">[];
}

export function RiskAssessmentForm({ mode, assessment, departments }: RiskAssessmentFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: assessment?.title ?? "",
      description: assessment?.description ?? "",
      departmentId: assessment?.departmentId ?? "",
      reviewDate: assessment?.reviewDate ? format(new Date(assessment.reviewDate), "yyyy-MM-dd") : "",
      status: assessment?.status ?? "DRAFT",
    },
  });

  const createMutation = trpc.riskAssessment.create.useMutation({
    onSuccess: (a) => {
      utils.riskAssessment.list.invalidate();
      success("Risikovurdering opprettet!");
      router.push(`/risiko/${a.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  const updateMutation = trpc.riskAssessment.update.useMutation({
    onSuccess: (a) => {
      utils.riskAssessment.list.invalidate();
      utils.riskAssessment.byId.invalidate({ id: a.id });
      success("Risikovurdering oppdatert!");
      router.push(`/risiko/${a.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    const deptId = values.departmentId || undefined;
    if (mode === "create") {
      await createMutation.mutateAsync({
        title: values.title,
        description: values.description,
        departmentId: deptId,
        reviewDate: values.reviewDate || undefined,
      });
    } else if (assessment) {
      await updateMutation.mutateAsync({
        id: assessment.id,
        title: values.title,
        description: values.description || null,
        departmentId: deptId ?? null,
        status: values.status,
        reviewDate: values.reviewDate || null,
      });
    }
  }

  const serverError = createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="space-y-1">
        <Label htmlFor="title">Tittel *</Label>
        <Input id="title" {...register("title")} placeholder="f.eks. Risikovurdering lager 2024" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea id="description" rows={3} placeholder="Hva er formålet med denne vurderingen?" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="departmentId">Avdeling</Label>
          <Select id="departmentId" {...register("departmentId")}>
            <option value="">Ingen avdeling</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reviewDate">Neste gjennomgang</Label>
          <Input id="reviewDate" type="date" {...register("reviewDate")} />
        </div>
      </div>

      {mode === "edit" && (
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="DRAFT">Utkast</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="REVIEW">Til gjennomgang</option>
            <option value="CLOSED">Lukket</option>
          </Select>
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer…" : mode === "create" ? "Opprett risikovurdering" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
      </div>
    </form>
  );
}
