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
  const cls = "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline";
  return isExternal ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
      {text} <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <Link href={url} className={cls}>
      {text} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

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
      {announcements.map((a: (typeof announcements)[number]) => {
        const cat = categoryFor(a.category);
        const Icon = cat.icon;
        return (
          <div key={a.id} className="rounded-2xl border bg-card p-4 space-y-1.5">
            <div className="flex items-start gap-2.5">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cat.chip)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug">{a.title}</p>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true, locale: nb })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{cat.label}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{a.body}</p>
            {a.linkUrl && <AnnouncementLink url={a.linkUrl} label={a.linkLabel} />}
            {a.author && (
              <p className="text-xs text-muted-foreground/70">
                — {a.author.fullName}{a.author.title ? `, ${a.author.title}` : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
