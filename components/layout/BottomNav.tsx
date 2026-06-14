"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShieldAlert, Plus, ShieldCheck, MoreHorizontal,
  Bell, BarChart2, Activity, LogOut, X,
  CalendarDays, FolderOpen, Zap, BookOpen, Clock, Shield, AlertTriangle, GraduationCap, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { clearAllDrafts } from "@/lib/offline/drafts";
import type { Role } from "@prisma/client";

interface MoreMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const moreItems: MoreMenuItem[] = [
  { href: "/fravaer",        label: "Fravær",          icon: CalendarDays, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/overtid",        label: "Overtid",          icon: Clock,        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/overtid/godkjenning", label: "Godkjenn overtid", icon: Clock,   roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/tiltak",         label: "Tiltak",           icon: Zap,          roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/dokumenter",     label: "Dokumenter",       icon: FolderOpen,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/personalhandbok",label: "Personalhåndbok",  icon: BookOpen,     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/varsler",        label: "Varsler",          icon: Bell,         roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/opplaering",        label: "Opplæring",        icon: GraduationCap,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/kjemikalier",       label: "Stoffkartotek",    icon: FlaskConical,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/opplaering/admin", label: "Opplæringsadmin",  icon: GraduationCap, roles: ["ADMIN", "HR"] },
  { href: "/varsling",          label: "Varsling",         icon: AlertTriangle, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/varsling/admin",   label: "Varslingssaker",  icon: AlertTriangle, roles: ["ADMIN", "HR"] },
  { href: "/rapporter",         label: "Rapporter",       icon: BarChart2, roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/admin/compliance",  label: "Compliance",      icon: Shield,    roles: ["ADMIN", "HR"] },
  { href: "/personvern",        label: "Personvern",      icon: Shield,    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/admin/system",      label: "Systemstatus",    icon: Activity,  roles: ["ADMIN"] },
];

interface BottomNavProps {
  role: Role;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isMoreActive =
    pathname.startsWith("/fravaer") ||
    pathname.startsWith("/overtid") ||
    pathname.startsWith("/dokumenter") ||
    pathname.startsWith("/tiltak") ||
    pathname.startsWith("/rapporter") ||
    pathname.startsWith("/varsler") ||
    pathname.startsWith("/ansatte") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/personalhandbok") ||
    pathname.startsWith("/varsling") ||
    pathname.startsWith("/opplaering") ||
    pathname.startsWith("/kjemikalier");

  async function handleLogout() {
    setOpen(false);
    clearAllDrafts();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleMoreItems = moreItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── More-meny (slide-up drawer) ──────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-16 z-50 bg-card border-t rounded-t-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-sm font-semibold">Mer</span>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent transition-colors"
            aria-label="Lukk meny"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="px-3 pb-2 space-y-1">
          {visibleMoreItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 min-h-[44px] text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-1 border-t mx-3 mt-1">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 min-h-[44px] text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logg ut
          </button>
        </div>
      </div>

      {/* ── Selve navigasjonslinjen ──────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">

          {/* Hjem */}
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Hjem</span>
          </Link>

          {/* Avvik */}
          <Link
            href="/avvik"
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              isActive("/avvik") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ShieldAlert className="h-5 w-5" />
            <span className="text-[10px] font-medium">Avvik</span>
          </Link>

          {/* Ny — primærknapp */}
          <Link
            href="/avvik/ny"
            className="flex flex-col items-center gap-0.5 -mt-4"
            aria-label="Nytt avvik"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Ny</span>
          </Link>

          {/* Risiko */}
          <Link
            href="/risiko"
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              isActive("/risiko") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-medium">Risiko</span>
          </Link>

          {/* Mer — åpner drawer */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              (isMoreActive || open) ? "text-primary" : "text-muted-foreground"
            )}
            aria-label="Mer"
            aria-expanded={open}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mer</span>
          </button>

        </div>
      </nav>
    </>
  );
}
