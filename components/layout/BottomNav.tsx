"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShieldAlert, Plus, LogOut, X, Menu, UserCircle, ChevronDown,
  CalendarDays, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { clearAllDrafts } from "@/lib/offline/drafts";
import {
  navGroups, topItems, isActive as isNavActive,
  type NavGroup, type NavItem,
} from "./Sidebar";
import type { Role } from "@prisma/client";

const isMorePath = (pathname: string) =>
  pathname !== "/dashboard" && pathname !== "/avvik" && pathname !== "/profil";

interface BottomNavProps {
  role: Role;
  isContractor?: boolean;
}

// Sammenleggbar gruppe i app-menyen — speiler desktop-sidemenyen.
function DrawerGroup({
  group, role, pathname, onNavigate, isContractor,
}: {
  group: NavGroup;
  role: Role;
  pathname: string;
  onNavigate: () => void;
  isContractor?: boolean;
}) {
  const visibleItems = group.items.filter((i) => i.roles.includes(role) && !(isContractor && i.employeeOnly));
  const hasActive = visibleItems.some((i) => isNavActive(i.href, pathname));
  const [open, setOpen] = useState(hasActive);

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          hasActive ? "text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {visibleItems.map((item) => (
            <DrawerLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function DrawerLink({
  item, pathname, onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isNavActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function BottomNav({ role, isContractor }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Valg i «+»-menyen. Fravær/overtid skjules for selvstendig næringsdrivende.
  const fabActions = [
    { href: "/avvik/ny", label: "Nytt avvik", icon: ShieldAlert },
    ...(!isContractor ? [{ href: "/fravaer/ny", label: "Ny fraværssøknad", icon: CalendarDays }] : []),
    ...(!isContractor ? [{ href: "/overtid/ny", label: "Ny overtid", icon: Clock }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isMoreActive = isMorePath(pathname);

  const visibleTopItems = topItems.filter((i) => i.roles.includes(role));
  const visibleGroups = navGroups.filter((g) => g.roles.includes(role));

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

      {/* ── Slide-from-left sidebar — speiler desktop-sidemenyen ─────────── */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-primary shadow-xl flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0">
          <span className="text-sm font-bold tracking-tight text-white">Truls HR</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Lukk meny"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups — sammenleggbart, som desktop */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleTopItems.map((item) => (
            <DrawerLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          ))}

          <div className="pt-1 space-y-0.5">
            {visibleGroups.map((group) => (
              <DrawerGroup
                key={group.label}
                group={group}
                role={role}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                isContractor={isContractor}
              />
            ))}
          </div>
        </nav>

        {/* Logg ut */}
        <div className="px-3 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 min-h-[42px] text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logg ut
          </button>
        </div>
      </div>

      {/* ── «+»-meny ─────────────────────────────────────────────────────── */}
      {fabOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setFabOpen(false)} aria-hidden="true" />
          <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-60 rounded-2xl border bg-card p-2 shadow-xl">
            {fabActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setFabOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

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

          {/* Ny — åpner meny med valg */}
          <button
            type="button"
            onClick={() => setFabOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 -mt-4"
            aria-label="Ny …"
            aria-expanded={fabOpen}
          >
            <span className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform",
              fabOpen && "rotate-45"
            )}>
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Ny</span>
          </button>

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
