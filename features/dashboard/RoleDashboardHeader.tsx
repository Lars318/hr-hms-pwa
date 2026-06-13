import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface RoleDashboardHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  variant?: "default" | "blue" | "green" | "orange" | "purple";
}

const variantStyles = {
  default: "bg-muted/50 border-border",
  blue:    "bg-blue-50 border-blue-200",
  green:   "bg-green-50 border-green-200",
  orange:  "bg-orange-50 border-orange-200",
  purple:  "bg-purple-50 border-purple-200",
};

const iconStyles = {
  default: "text-muted-foreground",
  blue:    "text-blue-600",
  green:   "text-green-600",
  orange:  "text-orange-600",
  purple:  "text-purple-600",
};

export function RoleDashboardHeader({
  title,
  subtitle,
  icon: Icon,
  variant = "default",
}: RoleDashboardHeaderProps) {
  return (
    <div className={cn("rounded-2xl border px-5 py-4 flex items-center gap-4", variantStyles[variant])}>
      {Icon && (
        <div className={cn("shrink-0", iconStyles[variant])}>
          <Icon className="h-7 w-7" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
