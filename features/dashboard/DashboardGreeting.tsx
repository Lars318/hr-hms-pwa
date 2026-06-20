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
    <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 px-4 pt-4 pb-2 lg:px-6 lg:pt-5 lg:pb-3">
      <div className="rounded-2xl bg-accent/80 px-6 pt-8 pb-7 flex flex-col items-center text-center space-y-5">
        <div>
          <p className="text-xs font-medium text-accent-foreground/60 capitalize mb-1">{dateStr}</p>
          <h1 className="text-3xl font-bold tracking-tight text-accent-foreground leading-tight">
            {greeting}, {firstName(name)}
          </h1>
        </div>

        <div className="w-full max-w-md [&_input]:bg-white/60 [&_input]:border-white/30 [&_input]:placeholder:text-accent-foreground/50 [&_input]:rounded-full [&_button]:rounded-full">
          <GlobalSearch role={role} />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
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
    </div>
  );
}
