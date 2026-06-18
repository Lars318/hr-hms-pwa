"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Megaphone } from "lucide-react";

const CARD_COLORS = [
  "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  "from-violet-500/10 to-violet-500/5 border-violet-500/20",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  "from-rose-500/10 to-rose-500/5 border-rose-500/20",
];

export function AnnouncementCards() {
  const { data: announcements = [], isLoading } = trpc.announcement.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shrink-0 w-72 h-36 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed px-5 py-6 text-muted-foreground">
        <Megaphone className="h-5 w-5 opacity-40 shrink-0" />
        <p className="text-sm">Ingen kunngjøringer ennå.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
      {announcements.map((a: (typeof announcements)[number], i) => (
        <div
          key={a.id}
          className={`shrink-0 w-72 rounded-2xl border bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} p-4 space-y-2`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug line-clamp-2">{a.title}</p>
            <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">
              {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true, locale: nb })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{a.body}</p>
          {a.author && (
            <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-current/10">
              {a.author.fullName}{a.author.title ? ` · ${a.author.title}` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
