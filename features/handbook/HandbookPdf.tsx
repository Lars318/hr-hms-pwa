"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function HandbookPdf({ canEdit = false }: { canEdit?: boolean }) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: doc, isLoading } = trpc.handbook.currentDocument.useQuery();
  const getUploadUrl = trpc.handbook.getDocumentUploadUrl.useMutation();
  const saveDoc = trpc.handbook.saveDocument.useMutation();
  const getUrl = trpc.handbook.getDocumentUrl.useMutation();
  const del = trpc.handbook.deleteDocument.useMutation({
    onSuccess: () => utils.handbook.currentDocument.invalidate(),
  });

  async function upload(file: File) {
    if (file.type !== "application/pdf") { setError("Kun PDF-filer støttes."); return; }
    setBusy(true); setError(null);
    try {
      const { signedUrl, filePath } = await getUploadUrl.mutateAsync({ fileName: file.name, sizeBytes: file.size });
      const res = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
      if (!res.ok) throw new Error("Opplasting feilet.");
      await saveDoc.mutateAsync({ fileName: file.name, filePath, sizeBytes: file.size });
      await utils.handbook.currentDocument.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved opplasting.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true); setError(null);
    try {
      const { signedUrl } = await getUrl.mutateAsync();
      window.open(signedUrl, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke åpne fil.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="rounded-2xl border bg-muted/40 h-20 animate-pulse" />;

  // Ingen fil + ikke admin → ikke vis noe.
  if (!doc && !canEdit) return null;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">Personalhåndbok (PDF)</p>
          {doc ? (
            <p className="text-xs text-muted-foreground truncate">
              {doc.fileName} · lastet opp {format(new Date(doc.createdAt), "d. MMM yyyy", { locale: nb })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Ingen PDF lastet opp ennå.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {doc && (
          <Button variant="outline" size="sm" disabled={busy} onClick={download}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            Last ned
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" />
            {doc ? "Bytt PDF" : "Last opp PDF"}
          </Button>
        )}
        {canEdit && doc && (
          <Button variant="outline" size="sm" disabled={del.isPending}
            className="text-destructive hover:text-destructive"
            onClick={() => del.mutate({ id: doc.id })}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Fjern
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
