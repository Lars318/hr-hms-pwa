"use client";

import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Phone, Mail, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
type EmployeeWithRelations = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  employedAt: Date;
  department: { name: string } | null;
  profileAssignments: { location: { id: string; name: string; city: string | null } | null }[];
};

interface EmployeeCardsProps {
  employees: EmployeeWithRelations[];
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const ROLE_CONFIG: Record<string, { label: string; avatarCls: string; badgeCls: string }> = {
  ADMIN:    { label: "Admin",   avatarCls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", badgeCls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  HR:       { label: "HR",      avatarCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  MANAGER:  { label: "Leder",   avatarCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  EMPLOYEE: { label: "Ansatt",  avatarCls: "bg-muted text-muted-foreground", badgeCls: "bg-muted text-muted-foreground" },
};

const ACTIVE_CARD_ROLE: Record<string, string> = {
  ADMIN:    "border-l-4 border-l-purple-400 dark:border-l-purple-600",
  HR:       "border-l-4 border-l-emerald-400 dark:border-l-emerald-600",
  MANAGER:  "border-l-4 border-l-blue-400 dark:border-l-blue-600",
  EMPLOYEE: "",
};

export function EmployeeCards({ employees }: EmployeeCardsProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Ingen ansatte funnet"
        description="Prøv å endre søk eller filter."
      />
    );
  }

  return (
    <div className="space-y-3">
      {employees.map((emp) => {
        const cfg = ROLE_CONFIG[emp.role] ?? ROLE_CONFIG.EMPLOYEE;
        const primaryLoc = emp.profileAssignments?.[0]?.location;
        const isActive = emp.status === "ACTIVE";

        return (
          <Link key={emp.id} href={`/ansatte/${emp.id}`} className="block group">
            <div className={cn(
              "rounded-2xl border bg-card px-4 py-4 transition-colors group-active:bg-muted/40",
              isActive ? ACTIVE_CARD_ROLE[emp.role] : "opacity-60"
            )}>
              {/* Top row */}
              <div className="flex items-center gap-3 mb-3">
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
                  {primaryLoc && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {primaryLoc.city ?? primaryLoc.name}
                      </span>
                    </div>
                  )}
                </div>

                <span className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                  cfg.badgeCls
                )}>
                  {cfg.label}
                </span>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Ansatt {format(new Date(emp.employedAt), "MMM yyyy", { locale: nb })}
                  {emp.department ? ` · ${emp.department.name}` : ""}
                </p>
                <div className="flex gap-2">
                  <a
                    href={`tel:${emp.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      emp.phone
                        ? "bg-muted hover:bg-muted/80 text-muted-foreground"
                        : "bg-muted/40 text-muted-foreground/30 pointer-events-none"
                    )}
                    aria-label={`Ring ${emp.fullName}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`mailto:${emp.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground"
                    aria-label={`Send e-post til ${emp.fullName}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
