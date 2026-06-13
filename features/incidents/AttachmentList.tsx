"use client";

import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Download, Trash2, Paperclip } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FileTypeBadge } from "@/components/shared/FileTypeBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import type { IncidentStatus, Role } from "@prisma/client";

interface AttachmentListProps {
  incidentId: string;
  incidentStatus: IncidentStatus;
  viewerRole: Role;
  viewerProfileId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  incidentId,
  incidentStatus,
  viewerRole,
  viewerProfileId,
}: AttachmentListProps) {
  const utils = trpc.useUtils();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: attachments = [], isLoading } = trpc.attachment.listByIncident.useQuery({
    incidentId,
  });

  const downloadMutation = trpc.attachment.createSignedDownloadUrl.useMutation({
    onSuccess: ({ signedUrl, fileName }) => {
      // Åpne i ny fane – nettleseren håndterer nedlasting
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadingId(null);
    },
    onError: () => setDownloadingId(null),
  });

  const deleteMutation = trpc.attachment.delete.useMutation({
    onSuccess: () => {
      utils.attachment.listByIncident.invalidate({ incidentId });
      setDeleteTarget(null);
    },
  });

  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";

  function canDelete(attachment: { uploadedById: string }) {
    if (isHrAdmin) return true;
    return attachment.uploadedById === viewerProfileId && incidentStatus === "OPEN";
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Laster vedlegg…</p>;
  }

  if (attachments.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="Ingen vedlegg"
        description="Last opp et vedlegg nedenfor."
      />
    );
  }

  return (
    <>
      <div className="rounded-md border divide-y">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-medium truncate">{att.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileTypeBadge mimeType={att.mimeType} />
                <span>{formatBytes(att.sizeBytes)}</span>
                <span>·</span>
                <span>{att.uploadedBy.fullName}</span>
                <span>·</span>
                <span>{format(new Date(att.createdAt), "d. MMM yyyy", { locale: nb })}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={downloadingId === att.id}
              onClick={() => {
                setDownloadingId(att.id);
                downloadMutation.mutate({ attachmentId: att.id });
              }}
              title="Last ned"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Last ned</span>
            </Button>

            {canDelete(att) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(att.id)}
                title="Slett"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Slett</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Slett vedlegg"
        description="Er du sikker på at du vil slette dette vedlegget? Filen fjernes permanent fra lagring."
        confirmLabel="Slett"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ attachmentId: deleteTarget });
        }}
      />
    </>
  );
}
