"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Building2, MapPin, ShieldAlert, FolderOpen,
  ShieldCheck, Zap, LogOut, CalendarDays, CalendarRange, BarChart2,
  Activity, BookOpen, Clock, Shield, AlertTriangle, GraduationCap,
  FlaskConical, ClipboardList, MessageSquare, FileWarning, FileText,
  KeyRound, ChevronDown,
} from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { clearAllDrafts } from "@/lib/offline/drafts";
import { PulsfolloLogo } from "@/components/PulsfolloLogo";
import type { ElementType } from "react";
import type { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  roles: Role[];
}

interface NavGroup {
  label: string;
  icon: ElementType;
  roles: Role[];
  items: NavItem[];
}

type NavEntry = { type: "item" } & NavItem | { type: "group" } & NavGroup;

const nav: NavEntry[] = [
  {
    type: "item",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    type: "group",
    label: "HMS",
    icon: ShieldAlert,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    items: [
      { href: "/avvik",       label: "Avvik",        icon: ShieldAlert,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/hms-runde",   label: "HMS-runde",    icon: ClipboardList,roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/risiko",      label: "Risiko",        icon: ShieldCheck,  roles: ["ADMIN", "HR", "MANAGER"] },
      { href: "/tiltak",      label: "Tiltak",        icon: Zap,          roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/kjemikalier", label: "Stoffkartotek", icon: FlaskConical, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/opplaering",  label: "Opplæring",     icon: GraduationCap,roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
    ],
  },
  {
    type: "group",
    label: "Personal",
    icon: Users,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    items: [
      { href: "/kollegaer",              label: "Kollegaer",           icon: Users,        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/ansatte",               label: "Ansatte (admin)",     icon: Users,        roles: ["ADMIN", "HR"] },
      { href: "/admin/avdelinger",      label: "Avdelinger",          icon: Building2,    roles: ["ADMIN", "HR"] },
      { href: "/lokasjoner",            label: "Lokasjoner",          icon: MapPin,       roles: ["ADMIN", "HR"] },
      { href: "/onboarding",            label: "Onboarding",          icon: ClipboardList,roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/medarbeidersamtaler",   label: "Medarbeidersamtaler", icon: MessageSquare,roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/kontrakter",            label: "Kontrakter",          icon: FileText,     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/admin/personalsaker",   label: "Personalsaker",       icon: FileWarning,  roles: ["ADMIN", "HR", "MANAGER"] },
    ],
  },
  {
    type: "group",
    label: "Fravær & Tid",
    icon: CalendarDays,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    items: [
      { href: "/fravaer",            label: "Fravær",            icon: CalendarDays,  roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/fravaer/kalender",   label: "Fraværskalender",   icon: CalendarRange, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/sykefravaer",        label: "Sykefraværsoppfølging", icon: Activity,  roles: ["ADMIN", "HR", "MANAGER"] },
      { href: "/overtid",            label: "Overtid",           icon: Clock,         roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/overtid/godkjenning",label: "Godkjenn overtid",  icon: Clock,         roles: ["ADMIN", "HR", "MANAGER"] },
    ],
  },
  {
    type: "group",
    label: "Dokumenter",
    icon: FolderOpen,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    items: [
      { href: "/dokumenter",     label: "Dokumenter",    icon: FolderOpen, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/personalhandbok",label: "Personalhåndbok",icon: BookOpen,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
    ],
  },
  {
    type: "group",
    label: "Admin",
    icon: Shield,
    roles: ["ADMIN", "HR"],
    items: [
      { href: "/opplaering/admin",      label: "Opplæringsadmin",    icon: GraduationCap, roles: ["ADMIN", "HR"] },
      { href: "/admin/onboarding",      label: "Onboarding-admin",   icon: ClipboardList, roles: ["ADMIN", "HR"] },
      { href: "/varsling",              label: "Varsling",            icon: AlertTriangle, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/varsling/admin",        label: "Varslingssaker",      icon: AlertTriangle, roles: ["ADMIN", "HR"] },
      { href: "/rapporter",             label: "Rapporter",           icon: BarChart2,     roles: ["ADMIN", "HR", "MANAGER"] },
      { href: "/admin/compliance",      label: "Compliance",          icon: Shield,        roles: ["ADMIN", "HR"] },
      { href: "/personvern",            label: "Personvern",          icon: Shield,        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
      { href: "/personvern/foresporsler",label: "GDPR-forespørsler",  icon: Shield,        roles: ["ADMIN", "HR"] },
      { href: "/admin/system",          label: "Systemstatus",        icon: Activity,      roles: ["ADMIN"] },
      { href: "/admin/reset-passord",   label: "Tilbakestill passord",icon: KeyRound,      roles: ["ADMIN"] },
    ],
  },
];

interface SidebarProps {
  role: Role;
}

function isActive(href: string, pathname: string) {
  if (pathname === href) return true;
  if (href === "/fravaer") return pathname.startsWith("/fravaer/") && !pathname.startsWith("/fravaer/kalender");
  return pathname.startsWith(href + "/");
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Auto-expand groups that contain the active page
  const initialOpen = nav
    .filter((e): e is { type: "group" } & NavGroup => e.type === "group")
    .filter((g) => g.items.some((item) => isActive(item.href, pathname)))
    .map((g) => g.label);

  const [openGroups, setOpenGroups] = useState<string[]>(initialOpen);

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  async function handleLogout() {
    clearAllDrafts();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <PulsfolloLogo size={22} />
        <span className="flex-1 text-sm font-bold tracking-tight text-primary">Pulsfollo</span>
        <button
          onClick={handleLogout}
          title="Logg ut"
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b">
        <GlobalSearch role={role} placeholder="Søk…" size="sm" />
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {nav.map((entry) => {
          if (entry.type === "item") {
            if (!entry.roles.includes(role)) return null;
            const active = isActive(entry.href, pathname);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <entry.icon className="h-4 w-4 shrink-0" />
                {entry.label}
              </Link>
            );
          }

          // Group
          const visibleItems = entry.items.filter((item) => item.roles.includes(role));
          if (!visibleItems.length || !entry.roles.some((r) => r === role)) return null;

          const isOpen = openGroups.includes(entry.label);
          const hasActive = visibleItems.some((item) => isActive(item.href, pathname));

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => toggleGroup(entry.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  hasActive && !isOpen
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <entry.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="ml-3 pl-3 border-l border-border space-y-0.5 mt-0.5 mb-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
