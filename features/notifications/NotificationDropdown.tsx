"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./NotificationItem";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: countData } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: recent = [] } = trpc.notification.list.useQuery(
    { take: 5 },
    { enabled: open }
  );

  const markOneMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markAllMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = countData?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label="Varsler"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold">
              Varsler {count > 0 && <span className="text-muted-foreground font-normal">({count} uleste)</span>}
            </p>
            {count > 0 && (
              <button
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                Merk alle som lest
              </button>
            )}
          </div>

          {/* Items */}
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Ingen varsler
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {recent.map((n) => {
                const item = (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={(id) => markOneMutation.mutate({ id })}
                    compact
                  />
                );
                return n.linkUrl ? (
                  <Link
                    key={n.id}
                    href={n.linkUrl}
                    onClick={() => {
                      setOpen(false);
                      if (!n.readAt) markOneMutation.mutate({ id: n.id });
                    }}
                  >
                    {item}
                  </Link>
                ) : (
                  <div key={n.id}>{item}</div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <Link
              href="/varsler"
              className="block text-center text-xs text-muted-foreground hover:underline py-1"
              onClick={() => setOpen(false)}
            >
              Se alle varsler →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
