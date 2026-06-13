"use client";

import { trpc } from "@/lib/trpc/client";
import { HandbookAcknowledgeButton } from "./HandbookAcknowledgeButton";
import { CheckCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function HandbookReadBanner() {
  const { data: latest, isLoading: loadingV } = trpc.handbook.latestVersion.useQuery();
  const { data: ack, isLoading: loadingA } = trpc.handbook.myAcknowledgement.useQuery();

  if (loadingV || loadingA || !latest) return null;

  if (ack) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-800">
            Du har bekreftet versjon {latest.version}
          </p>
          <p className="text-xs text-green-700">
            Publisert {format(new Date(latest.publishedAt), "d. MMMM yyyy", { locale: nb })}
            {latest.publishNote && ` — ${latest.publishNote}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <BookOpen className="h-5 w-5 text-amber-700 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Versjon {latest.version} venter på din bekreftelse
          </p>
          <p className="text-xs text-amber-700">
            Publisert {format(new Date(latest.publishedAt), "d. MMMM yyyy", { locale: nb })}
            {latest.publishNote && ` — ${latest.publishNote}`}
          </p>
        </div>
      </div>
      <HandbookAcknowledgeButton versionId={latest.id} />
    </div>
  );
}
