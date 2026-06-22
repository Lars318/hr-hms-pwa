"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Phone, Mail, ArrowRight, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { ROUTE_MAP } from "@/server/assistant/routeMap";
import type { Role } from "@prisma/client";

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

interface GlobalSearchProps {
  role: Role;
  placeholder?: string;
  size?: "sm" | "md";
}

export function GlobalSearch({ role, placeholder = "Søk etter kollega eller side…", size = "md" }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Employee search
  const { data: people = [] } = trpc.profile.directory.useQuery(
    { search: debouncedQuery },
    { enabled: debouncedQuery.length >= 2, staleTime: 30_000 }
  );

  // Route search
  const matchedRoutes = debouncedQuery.length >= 2
    ? ROUTE_MAP.filter((r) => {
        if (r.roles && !r.roles.includes(role)) return false;
        const q = debouncedQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }).slice(0, 4)
    : [];

  const hasResults = people.length > 0 || matchedRoutes.length > 0;
  const showPanel = open && debouncedQuery.length >= 2;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className={cn(
        "flex items-center gap-2 rounded-xl border bg-background px-3 transition-shadow",
        size === "sm" ? "h-9" : "h-11",
        open && "ring-2 ring-ring"
      )}>
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results panel */}
      {showPanel && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border bg-card shadow-xl overflow-hidden"
        >
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Ingen treff på «{debouncedQuery}»</p>
          ) : (
            <div>
              {/* Kollegaer */}
              {people.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Kollegaer
                  </p>
                  {people.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                        {p.avatarUrl
                          ? <Image src={p.avatarUrl} alt={p.fullName} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                          : initials(p.fullName)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.fullName}</p>
                        {p.title && <p className="text-xs text-muted-foreground truncate">{p.title}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {p.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            onClick={() => setOpen(false)}
                            className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                            aria-label={`Ring ${p.fullName}`}
                          >
                            <Phone className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                        <a
                          href={`mailto:${p.email}`}
                          onClick={() => setOpen(false)}
                          className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                          aria-label={`E-post til ${p.fullName}`}
                        >
                          <Mail className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sider */}
              {matchedRoutes.length > 0 && (
                <div className={cn(people.length > 0 && "border-t")}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Sider
                  </p>
                  {matchedRoutes.map((r) => (
                    <button
                      key={r.href}
                      onClick={() => navigate(r.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 border-t">
                <button
                  onClick={() => navigate(`/kollegaer?q=${encodeURIComponent(query)}`)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Se alle kollegaer →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
