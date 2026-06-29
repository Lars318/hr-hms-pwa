"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Megaphone, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryFor } from "./categories";

function AnnouncementLink({ url, label }: { url: string; label?: string | null }) {
  const isExternal = /^https?:\/\//i.test(url);
  const text = label || (isExternal ? "Åpne lenke" : "Åpne");
  const cls =
    "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline";
  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
        {text} <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <Link href={url} className={cls}>
      {text} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

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
      {announcements.map((a: (typeof announcements)[number]) => {
        const cat = categoryFor(a.category);
        const Icon = cat.icon;
        return (
          <div
            key={a.id}
            className={cn("shrink-0 w-72 rounded-2xl border bg-gradient-to-br p-4 space-y-2", cat.card)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cat.chip)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 pt-1">
                {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true, locale: nb })}
              </span>
            </div>
            <p className="font-semibold text-sm leading-snug line-clamp-2">{a.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{a.body}</p>
            {a.linkUrl && (
              <div className="pt-0.5">
                <AnnouncementLink url={a.linkUrl} label={a.linkLabel} />
              </div>
            )}
            {a.author && (
              <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-current/10">
                {a.author.fullName}{a.author.title ? ` · ${a.author.title}` : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
