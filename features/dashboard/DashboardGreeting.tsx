"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarOff, ShieldAlert, Users, BarChart2, Clock, UserCircle, BookOpen, HeartPulse } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Role } from "@prisma/client";

function getGreeting(hour: number) {
  if (hour < 10) return "God morgen";
  if (hour < 12) return "Hei";
  if (hour < 17) return "God ettermiddag";
  return "God kveld";
}

function firstName(name: string) {
  return name.split(" ")[0];
}

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  primary?: boolean;
}

function getQuickActions(role: Role): QuickAction[] {
  if (role === "MANAGER" || role === "HR" || role === "ADMIN") {
    return [
      { label: "Egenmelding",      href: "/fravaer/ny?type=EGENMELDING", icon: HeartPulse, primary: true },
      { label: "Meld fravær",      href: "/fravaer/ny",                  icon: CalendarOff },
      { label: "Nytt avvik",       href: "/avvik/ny",                    icon: ShieldAlert },
      { label: "Ansatte",          href: "/ansatte",                     icon: Users },
      { label: "Godkjenn overtid", href: "/overtid/godkjenning",         icon: Clock },
      { label: "Rapporter",        href: "/rapporter",                   icon: BarChart2 },
      { label: "Min profil",       href: "/profil",                      icon: UserCircle },
    ];
  }

  return [
    { label: "Egenmelding",     href: "/fravaer/ny?type=EGENMELDING", icon: HeartPulse, primary: true },
    { label: "Meld fravær",     href: "/fravaer/ny",                  icon: CalendarOff },
    { label: "Nytt avvik",      href: "/avvik/ny",                    icon: ShieldAlert },
    { label: "Personalhåndbok", href: "/personalhandbok",             icon: BookOpen },
    { label: "Min profil",      href: "/profil",                      icon: UserCircle },
  ];
}

interface DashboardGreetingProps {
  name: string;
  role: Role;
}

export function DashboardGreeting({ name, role }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Hei");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateStr(format(now, "EEEE d. MMMM yyyy", { locale: nb }));
  }, []);

  const actions = getQuickActions(role);

  return (
    <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 bg-accent/70 px-6 pt-6 pb-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-accent-foreground/60 capitalize mb-0.5">{dateStr}</p>
        <h1 className="text-2xl font-bold tracking-tight text-accent-foreground">
          {greeting}, {firstName(name)}
        </h1>
      </div>

      <div className="[&_input]:bg-white/50 [&_input]:border-white/30 [&_input]:placeholder:text-accent-foreground/50">
        <GlobalSearch role={role} />
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={
              a.primary
                ? "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                : "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium bg-white/40 text-accent-foreground border border-white/30 hover:bg-white/60 transition-colors"
            }
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
