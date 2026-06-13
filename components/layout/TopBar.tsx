"use client";

import { NotificationDropdown } from "@/features/notifications/NotificationDropdown";
import { PWAInstallPrompt } from "@/features/pwa/PWAInstallPrompt";

interface TopBarProps {
  email: string;
}

export function TopBar({ email }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 lg:px-6">
      {/* Logo/tittel synlig kun på mobil (sidebar er skjult) */}
      <span className="text-sm font-semibold tracking-tight lg:hidden">HR / HMS</span>

      <div className="flex items-center gap-3 ml-auto">
        <PWAInstallPrompt />
        <NotificationDropdown />
        <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[180px]">
          {email}
        </span>
      </div>
    </header>
  );
}
