"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserCircle, CalendarOff, ShieldAlert, Users, BarChart2, Clock, BookOpen } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
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
}

function getQuickActions(role: Role): QuickAction[] {
  const base: QuickAction[] = [
    { label: "Min profil",       href: "/profil",      icon: UserCircle },
    { label: "Meld fravær",      href: "/fravaer/ny",  icon: CalendarOff },
    { label: "Nytt avvik",       href: "/avvik/ny",    icon: ShieldAlert },
    { label: "Personalhåndbok",  href: "/personalhandbok", icon: BookOpen },
  ];

  if (role === "MANAGER" || role === "HR" || role === "ADMIN") {
    return [
      { label: "Min profil",         href: "/profil",               icon: UserCircle },
      { label: "Ansatte",            href: "/ansatte",              icon: Users },
      { label: "Meld fravær",        href: "/fravaer/ny",           icon: CalendarOff },
      { label: "Nytt avvik",         href: "/avvik/ny",             icon: ShieldAlert },
      { label: "Rapporter",          href: "/rapporter",            icon: BarChart2 },
      { label: "Godkjenn overtid",   href: "/overtid/godkjenning",  icon: Clock },
    ];
  }

  return base;
}

interface DashboardGreetingProps {
  name: string;
  role: Role;
}

export function DashboardGreeting({ name, role }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState("Hei");

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  const actions = getQuickActions(role);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border px-6 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName(name)} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hva vil du gjøre i dag?
        </p>
      </div>

      <GlobalSearch role={role} />

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-1.5 rounded-full border bg-card/80 px-4 py-2 text-sm font-medium hover:bg-card hover:shadow-sm transition-all"
          >
            <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
