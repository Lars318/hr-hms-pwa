"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HandbookCategory } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Tittel er påkrevd").max(200),
  description: z.string().max(500).optional(),
  order: z.coerce.number().int().min(0).optional().default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  category?: HandbookCategory;
}

export function HandbookCategoryForm({ mode, category }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: category?.title ?? "",
      description: category?.description ?? "",
      order: category?.order ?? 0,
    },
  });

  const createMutation = trpc.handbook.createCategory.useMutation({
    onSuccess: () => {
      utils.handbook.listCategories.invalidate();
      success("Kapittel opprettet!");
      router.push("/personalhandbok/admin");
    },
    onError: (err) => toastError(err.message),
  });

  const updateMutation = trpc.handbook.updateCategory.useMutation({
    onSuccess: () => {
      utils.handbook.listCategories.invalidate();
      success("Kapittel oppdatert!");
      router.push("/personalhandbok/admin");
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync(values);
    } else if (category) {
      await updateMutation.mutateAsync({ id: category.id, ...values });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="space-y-1">
        <Label htmlFor="title">Tittel *</Label>
        <Input id="title" {...register("title")} placeholder="f.eks. Arbeidsvilkår" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          rows={3}
          {...register("description")}
          placeholder="Kort beskrivelse av kapittelet…"
        />
      </div>

      <div className="space-y-1 max-w-xs">
        <Label htmlFor="order">Rekkefølge</Label>
        <Input id="order" type="number" min={0} {...register("order")} />
        <p className="text-xs text-muted-foreground">Lavere tall vises først</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
          {isSubmitting ? "Lagrer…" : mode === "create" ? "Opprett kapittel" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
