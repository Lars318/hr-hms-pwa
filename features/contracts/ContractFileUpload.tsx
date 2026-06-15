"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

export function ContractFileUpload({ contractId, hasFile, fileName }: { contractId: string; hasFile: boolean; fileName: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUploadUrl = trpc.contract.getUploadUrl.useMutation();
  const getDownloadUrl = trpc.contract.getDownloadUrl.useMutation({
    onSuccess: (d) => window.open(d.url, "_blank"),
  });

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { signedUrl } = await getUploadUrl.mutateAsync({
        contractId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      const res = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Opplasting feilet");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved opplasting");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={uploading}
          onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" />
          {uploading ? "Laster opp..." : hasFile ? "Erstatt fil" : "Last opp kontrakt"}
        </Button>

        {hasFile && (
          <Button size="sm" variant="outline" disabled={getDownloadUrl.isPending}
            onClick={() => getDownloadUrl.mutate(contractId)}>
            <Download className="h-4 w-4 mr-1.5" />
            {fileName ?? "Last ned"}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
