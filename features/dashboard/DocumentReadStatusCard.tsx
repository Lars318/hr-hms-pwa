import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/documents";
import type { DocumentCategory } from "@prisma/client";

interface UnconfirmedDoc {
  id: string;
  title: string;
  version: number;
  category: DocumentCategory;
}

interface DocumentReadStatusCardProps {
  expiringSoon: number;
  unconfirmed: UnconfirmedDoc[];
}

export function DocumentReadStatusCard({ expiringSoon, unconfirmed }: DocumentReadStatusCardProps) {
  const hasIssues = unconfirmed.length > 0 || expiringSoon > 0;

  return (
    <div className={`rounded-lg border bg-card col-span-full ${hasIssues ? "border-blue-200" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Dokumenter</h3>
        </div>
        <Link href="/dokumenter" className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Expiring soon metric */}
        {expiringSoon > 0 && (
          <div className="flex items-center gap-3 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
            <span className="font-bold">{expiringSoon}</span> dokument{expiringSoon !== 1 ? "er" : ""} utløper innen 30 dager
          </div>
        )}

        {/* Unread documents */}
        {unconfirmed.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <span className="text-green-600 font-bold">✓</span>
            Du har bekreftet alle dokumenter
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mangler lesebekreftelse ({unconfirmed.length})
            </p>
            <div className="divide-y rounded-md border">
              {unconfirmed.map((doc) => (
                <Link key={doc.id} href={`/dokumenter/${doc.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[doc.category]} · v{doc.version}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
