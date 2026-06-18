"use client";

import Link from "next/link";
import { NotificationDropdown } from "@/features/notifications/NotificationDropdown";
import { PWAInstallPrompt } from "@/features/pwa/PWAInstallPrompt";
import { UserCircle } from "lucide-react";

interface TopBarProps {
  email: string;
  profileId?: string;
}

export function TopBar({ email, profileId }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 lg:px-6">
      {/* Logo synlig kun på mobil */}
      <span className="text-sm font-bold tracking-tight lg:hidden text-primary">Pulsfollo</span>

      <div className="flex items-center gap-3 ml-auto">
        <PWAInstallPrompt />
        <NotificationDropdown />
        {profileId ? (
          <Link
            href={`/ansatte/${profileId}`}
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[180px]"
            title="Min profil"
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            {email}
          </Link>
        ) : (
          <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[180px]">
            {email}
          </span>
        )}
      </div>
    </header>
  );
}
