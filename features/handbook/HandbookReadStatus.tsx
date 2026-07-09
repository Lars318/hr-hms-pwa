"use client";

import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle, Clock } from "lucide-react";
import { ListCardSkeleton } from "@/components/ui/skeleton";

export function HandbookReadStatus() {
  const { data, isLoading } = trpc.handbook.readStatus.useQuery();

  if (isLoading) return <ListCardSkeleton count={4} />;
  if (!data?.version) {
    return (
      <p className="text-sm text-muted-foreground">
        Ingen versjon er publisert ennå.
      </p>
    );
  }

  const total = data.read.length + data.unread.length;
  const pct = total > 0 ? Math.round((data.read.length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Sammendrag */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Versjon {data.version.version}</p>
            <p className="text-xs text-muted-foreground">
              Publisert {format(new Date(data.version.publishedAt), "d. MMMM yyyy", { locale: nb })}
              {data.version.publishNote && ` — ${data.version.publishNote}`}
            </p>
          </div>
          <span className="text-2xl font-bold">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {data.read.length} av {total} ansatte har bekreftet lest
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Har lest */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle className="h-4 w-4" />
            Har lest ({data.read.length})
          </h3>
          {data.read.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ingen har bekreftet ennå.</p>
          ) : (
            <div className="space-y-1.5">
              {data.read.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border bg-card p-3 text-sm">
                  <span className="font-medium truncate">{p.fullName}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.department?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mangler */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Clock className="h-4 w-4" />
            Mangler lesing ({data.unread.length})
          </h3>
          {data.unread.length === 0 ? (
            <p className="text-xs text-muted-foreground">Alle har bekreftet!</p>
          ) : (
            <div className="space-y-1.5">
              {data.unread.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border bg-amber-50 border-amber-200 p-3 text-sm">
                  <span className="font-medium truncate">{p.fullName}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.department?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
