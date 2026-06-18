"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("h-8 w-8", className)} />;

  const options = [
    { value: "light", icon: Sun,     label: "Lys" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark",  icon: Moon,    label: "Mørk" },
  ] as const;

  return (
    <div className={cn("flex items-center rounded-lg border bg-muted p-0.5 gap-0.5", className)}>
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex items-center justify-center rounded-md h-7 w-7 transition-colors",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
