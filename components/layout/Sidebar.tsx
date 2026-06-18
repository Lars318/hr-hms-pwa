"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Building2, MapPin, ShieldAlert, FolderOpen, ShieldCheck, Zap, LogOut, CalendarDays, CalendarRange, BarChart2, Activity, BookOpen, Clock, Shield, AlertTriangle, GraduationCap, FlaskConical, ClipboardList, MessageSquare, FileWarning, FileText, KeyRound } from "lucide-react";
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

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/avvik",
    label: "Avvik",
    icon: ShieldAlert,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/ansatte",
    label: "Ansatte",
    icon: Users,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/lokasjoner",
    label: "Lokasjoner",
    icon: MapPin,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/admin/avdelinger",
    label: "Avdelinger",
    icon: Building2,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/dokumenter",
    label: "Dokumenter",
    icon: FolderOpen,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/personalhandbok",
    label: "Personalhåndbok",
    icon: BookOpen,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/risiko",
    label: "Risiko",
    icon: ShieldCheck,
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    href: "/tiltak",
    label: "Tiltak",
    icon: Zap,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/fravaer",
    label: "Fravær",
    icon: CalendarDays,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/fravaer/kalender",
    label: "Fraværskalender",
    icon: CalendarRange,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/overtid",
    label: "Overtid",
    icon: Clock,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/overtid/godkjenning",
    label: "Godkjenning overtid",
    icon: Clock,
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    href: "/rapporter",
    label: "Rapporter",
    icon: BarChart2,
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    href: "/opplaering",
    label: "Opplæring",
    icon: GraduationCap,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/kjemikalier",
    label: "Stoffkartotek",
    icon: FlaskConical,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/opplaering/admin",
    label: "Opplæringsadmin",
    icon: GraduationCap,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/varsling",
    label: "Varsling",
    icon: AlertTriangle,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/varsling/admin",
    label: "Varslingssaker",
    icon: AlertTriangle,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/admin/compliance",
    label: "Compliance",
    icon: Shield,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/admin/system",
    label: "Systemstatus",
    icon: Activity,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/reset-passord",
    label: "Tilbakestill passord",
    icon: KeyRound,
    roles: ["ADMIN"],
  },
  {
    href: "/personvern",
    label: "Personvern",
    icon: Shield,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/personvern/foresporsler",
    label: "GDPR-forespørsler",
    icon: Shield,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/onboarding",
    label: "Onboarding",
    icon: ClipboardList,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/admin/onboarding",
    label: "Onboarding-admin",
    icon: ClipboardList,
    roles: ["ADMIN", "HR"],
  },
  {
    href: "/medarbeidersamtaler",
    label: "Medarbeidersamtaler",
    icon: MessageSquare,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/admin/personalsaker",
    label: "Personalsaker",
    icon: FileWarning,
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    href: "/kontrakter",
    label: "Kontrakter",
    icon: FileText,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/hms-runde",
    label: "HMS-runde",
    icon: ClipboardList,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const visible = navItems.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    clearAllDrafts();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <PulsfolloLogo size={22} />
        <span className="text-sm font-bold tracking-tight text-primary">Pulsfollo</span>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {visible.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/fravaer" && pathname.startsWith(href + "/")) ||
            (href === "/fravaer" && pathname.startsWith("/fravaer/") && !pathname.startsWith("/fravaer/kalender"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logg ut
        </button>
      </div>
    </aside>
  );
}
