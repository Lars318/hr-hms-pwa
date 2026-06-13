import Link from "next/link";
import { Zap, ShieldAlert, CalendarDays, FileText, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryItem {
  label: string;
  value: string | number;
  href: string;
  icon: React.ElementType;
  highlight?: "warn" | "danger" | "ok" | "muted";
}

interface SummaryStripProps {
  openActions: number;
  openIncidents: number;
  pendingLeave: number;
  unconfirmedDocs: number;
  handbookStatus: { version: number | null; hasRead: boolean };
  overtimeBalance?: number | null;
}

export function SummaryStrip({
  openActions, openIncidents, pendingLeave, unconfirmedDocs, handbookStatus, overtimeBalance,
}: SummaryStripProps) {
  const otHours = overtimeBalance ?? 0;
  const items: SummaryItem[] = [
    {
      label: "Overtid",
      value: overtimeBalance === undefined || overtimeBalance === null ? "–" : `${otHours > 0 ? "+" : ""}${otHours}t`,
      href: "/overtid",
      icon: Clock,
      highlight: otHours > 0 ? "ok" : otHours < 0 ? "warn" : "muted",
    },
    {
      label: "Tiltak",
      value: openActions > 0 ? openActions : "OK",
      href: "/tiltak",
      icon: Zap,
      highlight: openActions > 0 ? "warn" : "ok",
    },
    {
      label: "Avvik",
      value: openIncidents > 0 ? openIncidents : "OK",
      href: "/avvik",
      icon: ShieldAlert,
      highlight: openIncidents > 0 ? "warn" : "ok",
    },
    {
      label: "Fravær",
      value: pendingLeave > 0 ? pendingLeave : "OK",
      href: "/fravaer",
      icon: CalendarDays,
      highlight: pendingLeave > 0 ? "warn" : "ok",
    },
    {
      label: "Dokumenter",
      value: unconfirmedDocs > 0 ? unconfirmedDocs : "OK",
      href: "/dokumenter",
      icon: FileText,
      highlight: unconfirmedDocs > 0 ? "warn" : "ok",
    },
    {
      label: "Håndbok",
      value: handbookStatus.version === null ? "—" : handbookStatus.hasRead ? "Lest" : "Ulest",
      href: "/personalhandbok",
      icon: BookOpen,
      highlight: handbookStatus.version !== null && !handbookStatus.hasRead ? "warn" : "ok",
    },
  ];

  const highlightClasses = {
    warn:   "text-amber-700",
    danger: "text-red-600",
    ok:     "text-green-600",
    muted:  "text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Min status</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {items.map(({ label, value, href, icon: Icon, highlight = "ok" }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-3 text-center hover:bg-accent/50 transition-colors active:scale-[0.97]"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className={cn("text-base font-bold leading-tight", highlightClasses[highlight])}>
              {value}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
