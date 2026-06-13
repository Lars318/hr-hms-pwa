"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./NotificationItem";
import { Bell } from "lucide-react";
import { ListCardSkeleton } from "@/components/ui/skeleton";

export function NotificationList() {
  const utils = trpc.useUtils();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data = [], isLoading } = trpc.notification.list.useQuery(
    { unreadOnly, take: 30 },
    { refetchOnWindowFocus: true }
  );

  const markAllMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markOneMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unread = data.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={!unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly(false)}
          >
            Alle
          </Button>
          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly(true)}
          >
            Uleste {unread > 0 && `(${unread})`}
          </Button>
        </div>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Merk alle som lest
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListCardSkeleton count={5} />
      ) : data.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Bell className="h-8 w-8" />
          <p className="text-sm">{unreadOnly ? "Ingen uleste varsler" : "Ingen varsler ennå"}</p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {data.map((n) => {
            const item = (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={(id) => markOneMutation.mutate({ id })}
              />
            );
            return n.linkUrl ? (
              <Link
                key={n.id}
                href={n.linkUrl}
                onClick={() => { if (!n.readAt) markOneMutation.mutate({ id: n.id }); }}
              >
                {item}
              </Link>
            ) : (
              <div key={n.id}>{item}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
