"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Megaphone } from "lucide-react";

export function AnnouncementList() {
  const { data: announcements = [], isLoading } = trpc.announcement.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
        <Megaphone className="h-8 w-8 opacity-30" />
        <p className="text-sm">Ingen kunngjøringer</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a: (typeof announcements)[number]) => (
        <div key={a.id} className="rounded-xl border bg-card p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">{a.title}</p>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true, locale: nb })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{a.body}</p>
          {a.author && (
            <p className="text-xs text-muted-foreground/70">
              — {a.author.fullName}{a.author.title ? `, ${a.author.title}` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
