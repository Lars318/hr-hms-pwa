"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MIME_LABELS,
} from "@/lib/supabase/admin";

const ACCEPT = ALLOWED_MIME_TYPES.join(",");
const MAX_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024;

interface AttachmentUploadProps {
  incidentId: string;
}

type UploadState =
  | { phase: "idle" }
  | { phase: "validating" }
  | { phase: "getting-url" }
  | { phase: "uploading" }
  | { phase: "saving" }
  | { phase: "done" }
  | { phase: "error"; message: string };

export function AttachmentUpload({ incidentId }: AttachmentUploadProps) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });

  const createUploadUrl = trpc.attachment.createUploadUrl.useMutation();
  const createMetadata = trpc.attachment.createMetadata.useMutation({
    onSuccess: () => {
      // Oppdater listen automatisk etter vellykket opplasting
      utils.attachment.listByIncident.invalidate({ incidentId });
    },
  });

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type as never)) {
      const allowed = ALLOWED_MIME_TYPES.map((m) => MIME_LABELS[m] ?? m).join(", ");
      return `Filtype ikke tillatt. Tillatte typer: ${allowed}.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Filen er for stor. Maks størrelse er ${MAX_MB} MB.`;
    }
    return null;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setState({ phase: "idle" });
  }

  function clearFile() {
    setSelectedFile(null);
    setState({ phase: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setState({ phase: "validating" });
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setState({ phase: "error", message: validationError });
      return;
    }

    try {
      // Steg 1: Hent signert upload-URL fra server
      setState({ phase: "getting-url" });
      const { signedUrl, filePath, attachmentId } = await createUploadUrl.mutateAsync({
        incidentId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
      });

      // Steg 2: Last opp direkte til Supabase Storage
      setState({ phase: "uploading" });
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Opplasting feilet: HTTP ${uploadResponse.status}`);
      }

      // Steg 3: Lagre metadata i Postgres (onSuccess-callback invaliderer listen)
      setState({ phase: "saving" });
      await createMetadata.mutateAsync({
        attachmentId,
        incidentId,
        fileName: selectedFile.name,
        filePath,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
      });

      setState({ phase: "done" });
      clearFile();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ukjent feil under opplasting.";
      setState({ phase: "error", message });
    }
  }

  const isUploading =
    state.phase === "validating" ||
    state.phase === "getting-url" ||
    state.phase === "uploading" ||
    state.phase === "saving";

  const phaseLabel: Record<string, string> = {
    validating: "Validerer…",
    "getting-url": "Forbereder…",
    uploading: "Laster opp…",
    saving: "Lagrer…",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label
          htmlFor="attachment-input"
          className="flex-1 cursor-pointer rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-ring hover:bg-muted/30 transition-colors"
        >
          {selectedFile ? (
            <span className="text-foreground">{selectedFile.name}</span>
          ) : (
            <span>
              Klikk for å velge fil (PDF, PNG, JPG, WEBP, DOCX, XLSX – maks {MAX_MB} MB)
            </span>
          )}
          <input
            id="attachment-input"
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>

        {selectedFile && !isUploading && (
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedFile && (
        <Button type="button" size="sm" disabled={isUploading} onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? (phaseLabel[state.phase] ?? "Laster opp…") : "Last opp vedlegg"}
        </Button>
      )}

      {state.phase === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      {state.phase === "done" && (
        <p className="text-sm text-green-700">Vedlegg lastet opp.</p>
      )}
    </div>
  );
}
