"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShieldAlert, Plus, ShieldCheck,
  Bell, BarChart2, Activity, LogOut, X, Menu, UserCircle,
  CalendarDays, FolderOpen, Zap, BookOpen, Clock, Shield, AlertTriangle, GraduationCap, FlaskConical,
  ClipboardList, FileText, MessageSquare, KeyRound, Users, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { clearAllDrafts } from "@/lib/offline/drafts";
import type { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Min dag",
    items: [
      { href: "/dashboard",    label: "Hjem",             icon: LayoutDashboard, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/profil",       label: "Min profil",        icon: UserCircle,     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/fravaer",      label: "Fravær",            icon: CalendarDays,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/overtid",      label: "Overtid",           icon: Clock,          roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/onboarding",   label: "Onboarding",        icon: ClipboardList,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
    ],
  },
  {
    label: "HMS",
    items: [
      { href: "/avvik",        label: "Avvik",             icon: ShieldAlert,    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/risiko",       label: "Risiko",            icon: ShieldCheck,    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/tiltak",       label: "Tiltak",            icon: Zap,            roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/kjemikalier",  label: "Stoffkartotek",     icon: FlaskConical,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/varsling",     label: "Varsling",          icon: AlertTriangle,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
    ],
  },
  {
    label: "HR",
    items: [
      { href: "/kollegaer",    label: "Kollegaer",         icon: Users,          roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/ansatte",      label: "Ansatte (admin)",   icon: Users,          roles: ["ADMIN", "HR"] },
      { href: "/opplaering",   label: "Opplæring",         icon: GraduationCap,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/kontrakter",   label: "Kontrakter",        icon: FileText,       roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/medarbeidersamtaler", label: "Samtaler",   icon: MessageSquare,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/sykefravaer",  label: "Sykefraværsoppfølging", icon: Activity,   roles: ["ADMIN", "HR", "MANAGER"] },
    ],
  },
  {
    label: "Dokumenter",
    items: [
      { href: "/dokumenter",      label: "Dokumenter",     icon: FolderOpen,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/personalhandbok", label: "Personalhåndbok",icon: BookOpen,     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/varsler",         label: "Varsler",        icon: Bell,         roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/rapporter",       label: "Rapporter",      icon: BarChart2,    roles: ["ADMIN", "HR", "MANAGER"] },
      { href: "/admin/compliance",label: "Compliance",     icon: Shield,       roles: ["ADMIN", "HR"] },
      { href: "/personvern",      label: "Personvern",     icon: Shield,       roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/admin/system",    label: "Systemstatus",   icon: Activity,     roles: ["ADMIN"] },
      { href: "/admin/reset-passord", label: "Tilbakestill pw", icon: KeyRound, roles: ["ADMIN"] },
      { href: "/opplaering/admin",label: "Opplæringsadmin",icon: GraduationCap,roles: ["ADMIN", "HR"] },
      { href: "/varsling/admin",  label: "Varslingssaker", icon: AlertTriangle,roles: ["ADMIN", "HR"] },
      { href: "/admin/onboarding",label: "Onboarding-admin",icon: ClipboardList,roles: ["ADMIN", "HR"] },
      { href: "/overtid/godkjenning", label: "Godkjenn overtid", icon: Clock,  roles: ["ADMIN", "HR", "MANAGER"] },
    ],
  },
];

const isMorePath = (pathname: string) =>
  ["/fravaer", "/overtid", "/dokumenter", "/tiltak", "/rapporter", "/varsler",
   "/profil", "/kollegaer", "/ansatte", "/admin", "/personalhandbok", "/varsling", "/opplaering",
   "/kjemikalier", "/onboarding", "/kontrakter", "/medarbeidersamtaler",
   "/sykefravaer"].some((p) => pathname.startsWith(p));

interface BottomNavProps {
  role: Role;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isMoreActive = isMorePath(pathname);

  async function handleLogout() {
    setOpen(false);
    clearAllDrafts();
    const supabase = createClient();
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
    } catch {
      // Naviger til login uansett
    }
    window.location.href = "/login";
  }

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-from-left sidebar ──────────────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
          <span className="text-sm font-bold tracking-tight text-primary">Truls HR</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Lukk meny"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups — kortbasert design */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((group) => {
            const visible = group.items.filter((i) => i.roles.includes(role));
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
                <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
                  {visible.map(({ href, label, icon: Icon, roles: _r }, idx) => {
                    const active = isActive(href);
                    const iconColors = [
                      "bg-green-50 text-green-700",
                      "bg-blue-50 text-blue-700",
                      "bg-amber-50 text-amber-700",
                      "bg-red-50 text-red-700",
                      "bg-purple-50 text-purple-700",
                      "bg-teal-50 text-teal-700",
                    ];
                    const iconColor = active ? "bg-primary/15 text-primary" : iconColors[idx % iconColors.length];
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 transition-colors",
                          active ? "bg-primary/5" : "hover:bg-muted/40"
                        )}
                      >
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconColor)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={cn("text-sm font-medium flex-1", active ? "text-primary" : "text-foreground")}>
                          {label}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground -rotate-90 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logg ut */}
        <div className="px-3 py-3 border-t shrink-0">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 min-h-[42px] text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logg ut
          </button>
        </div>
      </div>

      {/* ── Navigasjonslinje ─────────────────────────────────────────────── */}
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

          {/* Ny avvik — primærknapp */}
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

          {/* Min profil */}
          <Link
            href="/profil"
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              isActive("/profil") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <UserCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>

          {/* Meny — åpner sidebar */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors",
              (isMoreActive || open) ? "text-primary" : "text-muted-foreground"
            )}
            aria-label="Meny"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Meny</span>
          </button>

        </div>
      </nav>
    </>
  );
}
