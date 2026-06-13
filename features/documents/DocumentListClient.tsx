"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle, ChevronRight, FileText, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileTypeBadge } from "@/components/shared/FileTypeBadge";
import { CATEGORY_LABELS } from "@/lib/documents";
import type { Role } from "@prisma/client";

interface DocumentListClientProps {
  viewerRole: Role;
}

export function DocumentListClient({ viewerRole }: DocumentListClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");

  const isHrAdmin = viewerRole === "ADMIN" || viewerRole === "HR";

  const { data: docs = [], isLoading } = trpc.document.list.useQuery({
    search: search || undefined,
    category: (category as "POLICY") || undefined,
    visibility: (visibility as "PUBLIC" | "PRIVATE") || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0">
          <Input
            placeholder="Søk på tittel eller beskrivelse…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 min-w-[9rem] sm:w-44 sm:flex-none">
          <option value="">Alle kategorier</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </Select>
        {isHrAdmin && (
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="flex-1 min-w-[8rem] sm:w-40 sm:flex-none">
            <option value="">Alle synligheter</option>
            <option value="PUBLIC">Alle ansatte</option>
            <option value="PRIVATE">HR / Admin</option>
          </Select>
        )}
      </div>

      {isLoading ? (
        <><div className="md:hidden"><ListCardSkeleton count={4} /></div><div className="hidden md:block"><TableSkeleton rows={5} cols={5} /></div></>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="Ingen dokumenter funnet" description="Prøv å endre søk eller filter." />
      ) : (
        <>
          {/* ── Mobil: kort ──────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {docs.map((doc) => (
              <Link key={doc.id} href={`/dokumenter/${doc.id}`} className="block">
                <div className="rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {doc.visibility === "PRIVATE" && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium line-clamp-2 min-w-0">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.isConfirmedByMe && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[doc.category]}
                    </Badge>
                    <FileTypeBadge mimeType={doc.mimeType} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    v{doc.version} · {format(new Date(doc.updatedAt), "d. MMM yyyy", { locale: nb })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Desktop: tabell ──────────────────────────────────────── */}
          <div className="hidden md:block rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tittel</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Versjon</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Oppdatert</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lest</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {doc.visibility === "PRIVATE" && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium line-clamp-1">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[doc.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <FileTypeBadge mimeType={doc.mimeType} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      v{doc.version}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                      {format(new Date(doc.updatedAt), "d. MMM yyyy", { locale: nb })}
                    </td>
                    <td className="px-4 py-3">
                      {doc.isConfirmedByMe ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dokumenter/${doc.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Åpne</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{docs.length} dokumenter</p>
    </div>
  );
}
