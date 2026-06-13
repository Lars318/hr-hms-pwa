import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "danger" | "success";
}

const variantStyles = {
  default: "border-border",
  warning: "border-yellow-300 bg-yellow-50",
  danger: "border-red-300 bg-red-50",
  success: "border-green-300 bg-green-50",
};

const variantValueStyles = {
  default: "text-foreground",
  warning: "text-yellow-800",
  danger: "text-red-700",
  success: "text-green-700",
};

export function MetricCard({ title, value, description, href, icon: Icon, variant = "default" }: MetricCardProps) {
  const content = (
    <div className={cn("rounded-2xl border bg-card p-4 transition-colors", variantStyles[variant], href && "hover:bg-muted/40 cursor-pointer")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className={cn("text-2xl sm:text-3xl font-bold mt-1", variantValueStyles[variant])}>{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {Icon && (
          <div className={cn("rounded-md p-2 shrink-0", variant === "danger" ? "bg-red-100" : variant === "warning" ? "bg-yellow-100" : variant === "success" ? "bg-green-100" : "bg-muted")}>
            <Icon className={cn("h-5 w-5", variantValueStyles[variant])} />
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
