"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OnlineStatusBanner() {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestoredBanner(true);
      const timer = setTimeout(() => setShowRestoredBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestoredBanner) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
      >
        <WifiOff className="h-4 w-4" />
        Du er frakoblet – avvikskladder lagres lokalt
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-green-600 px-4 py-2 text-sm font-medium text-white"
    >
      <Wifi className="h-4 w-4" />
      Tilkobling gjenopprettet – synkroniserer kladder…
    </div>
  );
}
