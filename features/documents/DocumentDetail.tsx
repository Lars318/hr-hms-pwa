"use client";

import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Download, CheckCircle, Users, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileTypeBadge } from "@/components/shared/FileTypeBadge";
import { CATEGORY_LABELS, VISIBILITY_LABELS } from "@/lib/documents";
import type { Document, Role } from "@prisma/client";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface DocumentDetailProps {
  document: Document & {
    owner: { id: string; fullName: string };
    isConfirmedByMe: boolean;
    readStats: { total: number; confirmed: number; notConfirmed: number; percentage: number } | null;
  };
  viewerRole: Role;
}

export function DocumentDetail({ document: doc, viewerRole }: DocumentDetailProps) {
  const utils = trpc.useUtils();
  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";
  const [downloading, setDownloading] = useState(false);

  const downloadMutation = trpc.document.createSignedDownloadUrl.useMutation({
    onSuccess: ({ signedUrl, fileName }) => {
      const a = globalThis.document.createElement("a");
      a.href = signedUrl;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      setDownloading(false);
    },
    onError: () => setDownloading(false),
  });

  const confirmMutation = trpc.document.confirmRead.useMutation({
    onSuccess: () => utils.document.byId.invalidate({ id: doc.id }),
  });

  const readStatusQuery = trpc.document.readStatus.useQuery(
    { documentId: doc.id },
    { enabled: isHrAdmin }
  );

  return (
    <div className="space-y-6">
      {/* Hoveddetta */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{CATEGORY_LABELS[doc.category]}</Badge>
          <FileTypeBadge mimeType={doc.mimeType} />
          <Badge variant="outline">v{doc.version}</Badge>
          <Badge variant={doc.visibility === "PUBLIC" ? "success" : "muted"}>
            {VISIBILITY_LABELS[doc.visibility]}
          </Badge>
        </div>

        {doc.description && (
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{doc.description}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Eier</dt>
          <dd className="font-medium mt-0.5">{doc.owner.fullName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Størrelse</dt>
          <dd className="font-medium mt-0.5">{formatBytes(doc.sizeBytes)}</dd>
        </div>
        {doc.effectiveFrom && (
          <div>
            <dt className="text-muted-foreground">Gyldig fra</dt>
            <dd className="font-medium mt-0.5">
              {format(new Date(doc.effectiveFrom), "d. MMMM yyyy", { locale: nb })}
            </dd>
          </div>
        )}
        {doc.expiresAt && (
          <div>
            <dt className="text-muted-foreground">Utløper</dt>
            <dd className="font-medium mt-0.5">
              {format(new Date(doc.expiresAt), "d. MMMM yyyy", { locale: nb })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Sist oppdatert</dt>
          <dd className="font-medium mt-0.5">
            {format(new Date(doc.updatedAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
          </dd>
        </div>
      </dl>

      <Separator />

      {/* Handlinger */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={downloading}
          onClick={() => { setDownloading(true); downloadMutation.mutate({ documentId: doc.id }); }}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Forbereder…" : "Last ned"}
        </Button>

        {!doc.isConfirmedByMe ? (
          <Button
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate({ documentId: doc.id })}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {confirmMutation.isPending ? "Bekrefter…" : "Bekreft lest (v" + doc.version + ")"}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Du har bekreftet versjon {doc.version}
          </div>
        )}
      </div>

      {/* Lesestatistikk – kun HR/ADMIN */}
      {isHrAdmin && readStatusQuery.data && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Lesebekreftelser (v{doc.version})
            </h2>

            {/* Fremdriftslinje */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{readStatusQuery.data.confirmed} av {readStatusQuery.data.total} har lest</span>
                <span>{readStatusQuery.data.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${readStatusQuery.data.percentage}%` }}
                />
              </div>
            </div>

            {/* Hvem har lest */}
            {readStatusQuery.data.confirmedBy.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Har lest</p>
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {readStatusQuery.data.confirmedBy.map((c) => (
                    <div key={c.profileId} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{c.profile.fullName}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(c.confirmedAt), "d. MMM yyyy", { locale: nb })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hvem har ikke lest */}
            {readStatusQuery.data.notConfirmedBy.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Har ikke lest ({readStatusQuery.data.notConfirmed})
                </p>
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {readStatusQuery.data.notConfirmedBy.map((p) => (
                    <div key={p.id} className="px-3 py-2 text-sm">
                      <span>{p.fullName}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
