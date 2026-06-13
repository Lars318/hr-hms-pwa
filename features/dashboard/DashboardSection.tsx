import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  icon?: LucideIcon;
  href?: string;
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function DashboardSection({ title, icon: Icon, href, children, columns = 3 }: DashboardSectionProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {href ? (
          <Link href={href} className="text-sm font-semibold hover:underline">{title}</Link>
        ) : (
          <h2 className="text-sm font-semibold">{title}</h2>
        )}
      </div>
      <div className={cn("grid gap-3", gridCols)}>
        {children}
      </div>
    </div>
  );
}
