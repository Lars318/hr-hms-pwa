"use client";

import { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  HR: "HR",
  MANAGER: "Leder",
  EMPLOYEE: "Ansatt",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  HR: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  EMPLOYEE: "bg-green-100 text-green-700",
};

export function TestUserSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = trpc.profile.devList.useQuery();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(email: string) {
    setLoading(email);
    window.location.href = `/api/dev/impersonate?email=${encodeURIComponent(email)}`;
  }

  const profiles = data ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        title="Bytt testbruker (kun dev/admin)"
      >
        <Users className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Testbruker</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-2xl border bg-card shadow-lg overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
            Bytt til bruker
          </p>
          <div className="max-h-72 overflow-y-auto">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => switchTo(p.email)}
                disabled={!!loading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {p.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                {loading === p.email ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0", ROLE_COLORS[p.role] ?? "bg-muted text-muted-foreground")}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
