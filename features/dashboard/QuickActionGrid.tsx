import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "warning" | "danger";
}

interface QuickActionGridProps {
  actions: QuickAction[];
  title?: string;
}

const tileVariants = {
  default:  "border-border bg-card hover:bg-accent/60",
  primary:  "border-primary/30 bg-primary/5 hover:bg-primary/10",
  warning:  "border-yellow-300 bg-yellow-50 hover:bg-yellow-100",
  danger:   "border-red-300 bg-red-50 hover:bg-red-100",
};

const iconVariants = {
  default: "text-muted-foreground bg-muted",
  primary: "text-primary bg-primary/10",
  warning: "text-yellow-700 bg-yellow-100",
  danger:  "text-red-700 bg-red-100",
};

const labelVariants = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-yellow-800",
  danger:  "text-red-800",
};

export function QuickActionGrid({ actions, title = "Snarveier" }: QuickActionGridProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map(({ href, label, description, icon: Icon, variant = "default" }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-start gap-3 rounded-2xl border p-4 min-h-[88px] transition-colors active:scale-[0.98]",
              tileVariants[variant]
            )}
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", iconVariants[variant])}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold leading-tight", labelVariants[variant])}>{label}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
