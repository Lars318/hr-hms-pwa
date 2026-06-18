"use client";

import Link from "next/link";
import { NotificationDropdown } from "@/features/notifications/NotificationDropdown";
import { PWAInstallPrompt } from "@/features/pwa/PWAInstallPrompt";
import { PulsfolloLogo } from "@/components/PulsfolloLogo";
import { UserCircle } from "lucide-react";

interface TopBarProps {
  email: string;
}

export function TopBar({ email }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 lg:px-6">
      {/* Logo synlig kun på mobil */}
      <div className="flex items-center gap-2 lg:hidden">
        <PulsfolloLogo size={24} />
        <span className="text-sm font-bold tracking-tight text-primary">Pulsfollo</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <PWAInstallPrompt />
        <NotificationDropdown />
        <Link
          href="/profil"
          className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[180px]"
          title="Min profil"
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          {email}
        </Link>
      </div>
    </header>
  );
}
