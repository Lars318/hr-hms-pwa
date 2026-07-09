"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { ShieldAlert, Zap, CalendarDays, FileText, ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

const typeConfig = {
  incident: { icon: ShieldAlert, color: "text-orange-400" },
  action: { icon: Zap, color: "text-blue-400" },
  leave: { icon: CalendarDays, color: "text-purple-400" },
  document: { icon: FileText, color: "text-green-400" },
  inspection: { icon: ClipboardList, color: "text-teal-400" },
};

export function ActivityFeed() {
  const { data: events, isLoading } = trpc.dashboard.activityFeed.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">Ingen aktivitet å vise ennå.</p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const cfg = typeConfig[event.type];
        const Icon = cfg.icon;
        return (
          <Link
            key={`${event.type}-${event.id}`}
            href={event.href}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <p className="text-xs text-muted-foreground truncate">{event.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: nb })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
