"use client";

import Link from "next/link";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Megaphone, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { categoryFor } from "@/features/announcements/categories";

const FRESH_DAYS = 7;

/** Fremhevet kort for den nyeste kunngjøringen — vises kun hvis fersk (<7 dager). */
export function AnnouncementCard() {
  const { data = [] } = trpc.announcement.list.useQuery();
  const newest = data[0];
  if (!newest) return null;
  if (differenceInDays(new Date(), new Date(newest.publishedAt)) > FRESH_DAYS) return null;

  const cat = categoryFor(newest.category);
  const Icon = cat.icon;
  const href = newest.linkUrl || "/nyheter";

  return (
    <Link href={href} className="block rounded-2xl border bg-card overflow-hidden active:scale-[0.99] transition-transform">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${cat.chip}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium">Ny kunngjøring</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(newest.publishedAt), { addSuffix: true, locale: nb })}
          </span>
        </div>
        <p className="text-sm font-medium">{newest.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">{newest.body}</p>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <span className="text-xs text-primary">{newest.linkLabel || "Les mer"}</span>
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>
    </Link>
  );
}

/** Diskret inngang til hele nyhetsarkivet med teller for ferske kunngjøringer. */
export function NewsRow() {
  const { data = [] } = trpc.announcement.list.useQuery();
  if (data.length === 0) return null;

  const freshCount = data.filter((a) => differenceInDays(new Date(), new Date(a.publishedAt)) <= FRESH_DAYS).length;

  return (
    <Link href="/nyheter" className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 active:scale-[0.99] transition-transform">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Megaphone className="h-[18px] w-[18px] text-primary" />
        {freshCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground border-2 border-card">
            {freshCount}
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">Nyheter</p>
        <p className="text-xs text-muted-foreground truncate">
          {freshCount > 0 ? `${freshCount} ny${freshCount !== 1 ? "e" : ""} kunngjøring${freshCount !== 1 ? "er" : ""}` : "Se alle kunngjøringer"}
        </p>
      </div>
      <ChevronRight className="h-[18px] w-[18px] text-muted-foreground/50" />
    </Link>
  );
}
