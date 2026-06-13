"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DocumentUpload } from "./DocumentUpload";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/lib/documents";
import { useToast } from "@/lib/toast";
import type { Document } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Tittel er påkrevd").max(200),
  category: z.enum(["POLICY", "PROCEDURE", "INSTRUCTION", "CHECKLIST", "TEMPLATE", "HMS", "HR", "OTHER"]),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  effectiveFrom: z.string().optional(),
  expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type UploadedFile = {
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  documentId: string;
  fileName: string;
};

interface DocumentFormProps {
  mode: "create" | "edit";
  document?: Document;
}

function toLocalDate(d: Date | null | undefined): string {
  if (!d) return "";
  return format(new Date(d), "yyyy-MM-dd");
}

export function DocumentForm({ mode, document }: DocumentFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: document?.title ?? "",
      category: document?.category ?? "OTHER",
      description: document?.description ?? "",
      visibility: document?.visibility ?? "PUBLIC",
      effectiveFrom: toLocalDate(document?.effectiveFrom),
      expiresAt: toLocalDate(document?.expiresAt),
    },
  });

  const createMutation = trpc.document.create.useMutation({
    onSuccess: (doc) => {
      utils.document.list.invalidate();
      success("Dokument opprettet!");
      router.push(`/dokumenter/${doc.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  const updateMutation = trpc.document.update.useMutation({
    onSuccess: (doc) => {
      utils.document.list.invalidate();
      utils.document.byId.invalidate({ id: doc.id });
      success("Dokument oppdatert!");
      router.push(`/dokumenter/${doc.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    const toISO = (v: string | undefined) => v ? new Date(v).toISOString() : undefined;

    if (mode === "create") {
      if (!uploadedFile) return;
      await createMutation.mutateAsync({
        documentId: uploadedFile.documentId,
        title: values.title,
        category: values.category,
        description: values.description || undefined,
        visibility: values.visibility,
        filePath: uploadedFile.filePath,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeBytes,
        effectiveFrom: toISO(values.effectiveFrom),
        expiresAt: toISO(values.expiresAt),
      });
    } else if (document) {
      const hasNewFile = !!uploadedFile;
      await updateMutation.mutateAsync({
        id: document.id,
        title: values.title,
        category: values.category,
        description: values.description || undefined,
        visibility: values.visibility,
        effectiveFrom: toISO(values.effectiveFrom) ?? null,
        expiresAt: toISO(values.expiresAt) ?? null,
        ...(hasNewFile ? {
          filePath: uploadedFile!.filePath,
          mimeType: uploadedFile!.mimeType,
          sizeBytes: uploadedFile!.sizeBytes,
          bumpVersion: true,
        } : { bumpVersion: false }),
      });
    }
  }

  const serverError = createMutation.error?.message ?? updateMutation.error?.message;
  const requireFile = mode === "create" && !uploadedFile;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {/* Filseksjon */}
      <div className="space-y-2">
        <Label>
          {mode === "create" ? "Fil *" : "Erstatt fil (valgfritt – bumper versjon)"}
        </Label>
        {uploadedFile ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-medium">{uploadedFile.fileName}</span>
            <span className="text-muted-foreground ml-auto">klar</span>
          </div>
        ) : (
          <DocumentUpload
            existingDocumentId={document?.id}
            onReady={setUploadedFile}
          />
        )}
        {uploadedFile && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setUploadedFile(null)}
          >
            Velg annen fil
          </button>
        )}
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-1">
        <Label htmlFor="title">Tittel *</Label>
        <Input id="title" {...register("title")} placeholder="f.eks. Brannvernsinstruks" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="category">Kategori *</Label>
          <Select id="category" {...register("category")}>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="visibility">Synlighet *</Label>
          <Select id="visibility" {...register("visibility")}>
            {Object.entries(VISIBILITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea id="description" rows={3} placeholder="Kort beskrivelse av dokumentet…" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="effectiveFrom">Gyldig fra</Label>
          <Input id="effectiveFrom" type="date" {...register("effectiveFrom")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="expiresAt">Utløper</Label>
          <Input id="expiresAt" type="date" {...register("expiresAt")} />
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {requireFile && <p className="text-sm text-destructive">Du må laste opp en fil før du kan lagre.</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || requireFile}>
          {isSubmitting ? "Lagrer…" : mode === "create" ? "Opprett dokument" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
      </div>
    </form>
  );
}
