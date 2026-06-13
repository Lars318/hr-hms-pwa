import Link from "next/link";
import { BookOpen, FolderOpen, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/documents";
import type { DocumentCategory } from "@prisma/client";

interface Doc {
  id: string;
  title: string;
  version: number;
  category: string;
}

interface DocumentsHandbookSectionProps {
  unconfirmedDocs: Doc[];
  handbookStatus: { version: number | null; hasRead: boolean };
}

export function DocumentsHandbookSection({ unconfirmedDocs, handbookStatus }: DocumentsHandbookSectionProps) {
  const allOk = unconfirmedDocs.length === 0 && (handbookStatus.version === null || handbookStatus.hasRead);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dokumenter og personalhåndbok</h2>

      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Håndbok-status */}
        {handbookStatus.version !== null && (
          <Link
            href="/personalhandbok"
            className="flex items-center gap-3 px-4 py-3.5 border-b hover:bg-muted/30 transition-colors min-h-[56px]"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${handbookStatus.hasRead ? "bg-green-50" : "bg-amber-50"}`}>
              <BookOpen className={`h-4 w-4 ${handbookStatus.hasRead ? "text-green-600" : "text-amber-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Personalhåndbok v{handbookStatus.version}</p>
              <p className="text-xs text-muted-foreground">
                {handbookStatus.hasRead ? "Du har bekreftet lesing" : "Venter på din bekreftelse"}
              </p>
            </div>
            {handbookStatus.hasRead
              ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            }
          </Link>
        )}

        {/* Ubekreftede dokumenter */}
        {unconfirmedDocs.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Alle dokumenter lest</p>
              <p className="text-xs text-muted-foreground">Du har bekreftet alle dokumenter</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 bg-amber-50 border-b">
              <p className="text-xs font-medium text-amber-700">
                {unconfirmedDocs.length} dokument{unconfirmedDocs.length > 1 ? "er" : ""} venter på lesebekreftelse
              </p>
            </div>
            <div className="divide-y">
              {unconfirmedDocs.map((doc) => (
                <Link key={doc.id} href={`/dokumenter/${doc.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[52px]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[doc.category as DocumentCategory] ?? doc.category} · v{doc.version}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bunnen: snarveier */}
        <div className="flex border-t divide-x">
          <Link href="/dokumenter" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors min-h-[44px]">
            <FolderOpen className="h-3.5 w-3.5" />
            Dokumentarkiv
          </Link>
          <Link href="/personalhandbok" className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors min-h-[44px]">
            <BookOpen className="h-3.5 w-3.5" />
            Personalhåndbok
          </Link>
        </div>
      </div>
    </div>
  );
}
