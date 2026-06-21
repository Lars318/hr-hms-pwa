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

interface NavSection {
  type: "section";
  label: string;
  roles: Role[];
}

// Flat nav — every item is a direct link, no accordion groups.
// Items are shown/hidden purely by role.
const navItems: NavItem[] = [
  // Alle roller
  { href: "/dashboard",       label: "Dashboard",         icon: LayoutDashboard, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/fravaer",         label: "Fravær",            icon: CalendarDays,    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/overtid",         label: "Overtid",           icon: Clock,           roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/avvik",           label: "Avvik",             icon: ShieldAlert,     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/personalhandbok", label: "Personalhåndbok",   icon: BookOpen,        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/kollegaer",       label: "Kollegaer",         icon: Users,           roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/dokumenter",      label: "Dokumenter",        icon: FolderOpen,      roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
  { href: "/varsling",        label: "Varsling",          icon: AlertTriangle,   roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },

  // Leder+
  { href: "/fravaer/kalender",    label: "Fraværskalender",       icon: CalendarRange, roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/overtid/godkjenning", label: "Godkjenn overtid",      icon: Clock,         roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/sykefravaer",         label: "Sykefraværsoppfølging", icon: Activity,      roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/tiltak",              label: "Tiltak",                icon: Zap,           roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/risiko",              label: "Risiko",                icon: ShieldCheck,   roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/medarbeidersamtaler", label: "Medarbeidersamtaler",   icon: MessageSquare, roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/admin/personalsaker", label: "Personalsaker",         icon: FileWarning,   roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/rapporter",           label: "Rapporter",             icon: BarChart2,     roles: ["ADMIN", "HR", "MANAGER"] },
  { href: "/opplaering/matrise",  label: "Kompetansematrise",     icon: GraduationCap, roles: ["ADMIN", "HR", "MANAGER"] },

  // HR + Admin
  { href: "/ansatte",              label: "Ansatte",              icon: Users,         roles: ["ADMIN", "HR"] },
  { href: "/admin/avdelinger",     label: "Avdelinger",           icon: Building2,     roles: ["ADMIN", "HR"] },
  { href: "/lokasjoner",           label: "Lokasjoner",           icon: MapPin,        roles: ["ADMIN", "HR"] },
  { href: "/hms-runde",            label: "HMS-runde",            icon: ClipboardList, roles: ["ADMIN", "HR"] },
  { href: "/kjemikalier",          label: "Stoffkartotek",        icon: FlaskConical,  roles: ["ADMIN", "HR"] },
  { href: "/opplaering",           label: "Opplæring",            icon: GraduationCap, roles: ["ADMIN", "HR"] },
  { href: "/opplaering/admin",     label: "Opplæringsadmin",      icon: GraduationCap, roles: ["ADMIN", "HR"] },
  { href: "/onboarding",           label: "Onboarding",           icon: ClipboardList, roles: ["ADMIN", "HR"] },
  { href: "/admin/onboarding",     label: "Onboarding-admin",     icon: ClipboardList, roles: ["ADMIN", "HR"] },
  { href: "/kontrakter",           label: "Kontrakter",           icon: FileText,      roles: ["ADMIN", "HR"] },
  { href: "/varsling/admin",       label: "Varslingssaker",       icon: AlertTriangle, roles: ["ADMIN", "HR"] },
  { href: "/admin/compliance",     label: "Compliance",           icon: Shield,        roles: ["ADMIN", "HR"] },
  { href: "/personvern",           label: "Personvern",           icon: Shield,        roles: ["ADMIN", "HR"] },
  { href: "/personvern/foresporsler", label: "GDPR-forespørsler", icon: Shield,        roles: ["ADMIN", "HR"] },
  { href: "/admin/system",         label: "Systemstatus",         icon: Activity,      roles: ["ADMIN"] },
  { href: "/admin/reset-passord",  label: "Tilbakestill passord", icon: KeyRound,      roles: ["ADMIN"] },
];

// Section dividers shown between role-bands
const sections: NavSection[] = [
  { type: "section", label: "Leder",  roles: ["ADMIN", "HR", "MANAGER"] },
  { type: "section", label: "HR / Admin", roles: ["ADMIN", "HR"] },
];

// First item index per section (used to inject divider before the block)
const sectionStartHrefs: Record<string, string> = {
  "Leder":       "/fravaer/kalender",
  "HR / Admin":  "/ansatte",
};

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

  // Admin/HR get a collapsible "advanced" section to keep the list short
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    navItems
      .filter((i) => i.roles.every((r) => r !== "MANAGER" && r !== "EMPLOYEE"))
      .some((i) => isActive(i.href, pathname))
  );

  async function handleLogout() {
    clearAllDrafts();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = navItems.filter((i) => i.roles.includes(role));

  // Split into primary (all roles + manager) and advanced (HR/admin only)
  const primaryItems = visibleItems.filter(
    (i) => i.roles.includes("EMPLOYEE") || i.roles.includes("MANAGER")
  );
  const advancedItems = visibleItems.filter(
    (i) => !i.roles.includes("EMPLOYEE") && !i.roles.includes("MANAGER")
  );

  const hasAdvanced = advancedItems.length > 0;

  return (
    <aside className="hidden lg:flex h-full w-56 flex-col bg-primary">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <PulsfolloLogo size={22} />
        <span className="flex-1 text-sm font-bold tracking-tight text-white">Truls HR</span>
        <button
          onClick={handleLogout}
          title="Logg ut"
          className="flex items-center justify-center rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-white/10">
        <GlobalSearch role={role} placeholder="Søk…" size="sm" />
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {primaryItems.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {hasAdvanced && (
          <>
            <div className="pt-3 pb-0.5">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/35 hover:text-white/60 transition-colors"
              >
                <span className="flex-1 text-left">Admin</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", advancedOpen && "rotate-180")} />
              </button>
            </div>

            {advancedOpen && (
              <div className="space-y-0.5">
                {advancedItems.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-white/20 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white shrink-0">
            {role.charAt(0)}
          </div>
          <span className="text-xs text-white/50 flex-1 truncate">{role}</span>
        </div>
      </div>
    </aside>
  );
}
