"use client";

import { useState } from "react";
import { Search, MapPin, Phone, Mail, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Location { id: string; name: string; city: string | null }

interface DirectoryClientProps {
  locations: Location[];
}

const ROLE_CONFIG: Record<string, { label: string; avatarCls: string; badgeCls: string }> = {
  ADMIN:    { label: "Admin",  avatarCls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", badgeCls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  HR:       { label: "HR",     avatarCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  MANAGER:  { label: "Leder",  avatarCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  EMPLOYEE: { label: "Ansatt", avatarCls: "bg-muted text-muted-foreground", badgeCls: "bg-muted text-muted-foreground" },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function DirectoryClient({ locations }: DirectoryClientProps) {
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");

  const { data: employees = [], isLoading } = trpc.profile.directory.useQuery({
    search: search || undefined,
    locationId: locationId || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Søk */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Søk navn eller stilling…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Lokasjon-chips */}
      {locations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setLocationId("")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              !locationId ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Alle lokasjoner
          </button>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setLocationId(locationId === loc.id ? "" : loc.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                locationId === loc.id ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {loc.city ?? loc.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={Users} title="Ingen kollegaer funnet" description="Prøv et annet søk eller lokasjon." />
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const cfg = ROLE_CONFIG[emp.role] ?? ROLE_CONFIG.EMPLOYEE;
            const loc = emp.profileAssignments?.[0]?.location;

            return (
              <div key={emp.id} className="rounded-2xl border bg-card px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 select-none",
                    cfg.avatarCls
                  )}>
                    {emp.avatarUrl
                      ? <img src={emp.avatarUrl} alt={emp.fullName} className="h-11 w-11 rounded-full object-cover" />
                      : initials(emp.fullName)
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{emp.fullName}</p>
                    {emp.title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{emp.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {loc && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">{loc.city ?? loc.name}</span>
                        </div>
                      )}
                      {emp.department && (
                        <span className="text-xs text-muted-foreground">{emp.department.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold hidden sm:block", cfg.badgeCls)}>
                      {cfg.label}
                    </span>
                    {emp.phone && (
                      <a
                        href={`tel:${emp.phone}`}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        aria-label={`Ring ${emp.fullName}`}
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                    <a
                      href={`mailto:${emp.email}`}
                      className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      aria-label={`E-post til ${emp.fullName}`}
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{employees.length} kollegaer</p>
    </div>
  );
}
