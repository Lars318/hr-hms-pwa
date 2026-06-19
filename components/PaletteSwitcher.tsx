"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTE_KEY = "app-palette";

const PALETTES = [
  { name: "sage",  label: "Sage & Terrakotta", primary: "#5a7a45", accent: "#b07058" },
  { name: "ocean", label: "Hav & Sand",         primary: "#2e7a8f", accent: "#c49050" },
  { name: "moss",  label: "Mose & Valnøtt",     primary: "#4e7038", accent: "#7a5535" },
] as const;

export function PaletteSwitcher() {
  const [current, setCurrent] = useState("sage");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(PALETTE_KEY) ?? "sage";
    setCurrent(stored);
    document.documentElement.dataset.palette = stored;
  }, []);

  function choosePalette(name: string) {
    localStorage.setItem(PALETTE_KEY, name);
    document.documentElement.dataset.palette = name;
    setCurrent(name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Bytt fargepalett"
        className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Palette className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-52 rounded-2xl border bg-popover shadow-xl p-2 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-2 pb-1">Fargepalett</p>
            {PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => choosePalette(p.name)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted",
                  current === p.name && "bg-muted font-medium"
                )}
              >
                <div className="flex gap-1 shrink-0">
                  <span className="h-4 w-4 rounded-full border border-white/20 shadow-sm" style={{ background: p.primary }} />
                  <span className="h-4 w-4 rounded-full border border-white/20 shadow-sm" style={{ background: p.accent }} />
                </div>
                {p.label}
                {current === p.name && <span className="ml-auto text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
