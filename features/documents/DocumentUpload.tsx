"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MIME_LABELS } from "@/lib/supabase/admin";

const ACCEPT = ALLOWED_MIME_TYPES.join(",");
const MAX_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024;

type UploadPhase = "idle" | "validating" | "getting-url" | "uploading" | "error";

interface DocumentUploadProps {
  existingDocumentId?: string;
  onReady: (result: { filePath: string; mimeType: string; sizeBytes: number; documentId: string; fileName: string }) => void;
}

export function DocumentUpload({ existingDocumentId, onReady }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const createUploadUrl = trpc.document.createUploadUrl.useMutation();

  function validateFile(f: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(f.type as never)) {
      const allowed = ALLOWED_MIME_TYPES.map((m) => MIME_LABELS[m] ?? m).join(", ");
      return `Filtype ikke tillatt. Tillatte: ${allowed}.`;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) return `Filen er for stor. Maks ${MAX_MB} MB.`;
    return null;
  }

  function clear() {
    setFile(null);
    setPhase("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload(selectedFile: File) {
    setError(null);
    setPhase("validating");
    const validationError = validateFile(selectedFile);
    if (validationError) { setError(validationError); setPhase("error"); return; }

    try {
      setPhase("getting-url");
      const { signedUrl, filePath, documentId } = await createUploadUrl.mutateAsync({
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
        existingDocumentId,
      });

      setPhase("uploading");
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!res.ok) throw new Error(`Opplasting feilet: HTTP ${res.status}`);

      setPhase("idle");
      onReady({ filePath, mimeType: selectedFile.type, sizeBytes: selectedFile.size, documentId, fileName: selectedFile.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukjent feil.");
      setPhase("error");
    }
  }

  const busy = phase === "validating" || phase === "getting-url" || phase === "uploading";
  const phaseLabel: Record<string, string> = {
    validating: "Validerer…", "getting-url": "Forbereder…", uploading: "Laster opp…",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label
          htmlFor="doc-upload-input"
          className="flex-1 cursor-pointer rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-ring hover:bg-muted/30 transition-colors"
        >
          {file ? <span className="text-foreground">{file.name}</span>
            : <span>Klikk for å velge fil (PDF, DOCX, XLSX, PNG, JPG – maks {MAX_MB} MB)</span>}
          <input
            id="doc-upload-input"
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setError(null);
              setPhase("idle");
            }}
          />
        </label>
        {file && !busy && (
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {file && (
        <Button type="button" size="sm" disabled={busy} onClick={() => handleUpload(file)}>
          <Upload className="h-4 w-4 mr-2" />
          {busy ? (phaseLabel[phase] ?? "Laster opp…") : "Last opp fil"}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
