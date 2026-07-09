import Link from "next/link";
import { ShieldAlert, CalendarDays, BookOpen, FolderOpen, Zap, Bell, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryAction {
  href: string | null;
  label: string;
  icon: React.ElementType;
  variant: "warning" | "primary" | "default";
  comingSoon?: boolean;
}

interface SecondaryAction {
  href: string;
  label: string;
  icon: React.ElementType;
}

const primaryActions: PrimaryAction[] = [
  { href: "/personalhandbok",label: "Les håndbok",        icon: BookOpen,     variant: "default" },
  { href: "/fravaer/ny",     label: "Søk fravær",         icon: CalendarDays, variant: "primary" },
  { href: "/overtid/ny",     label: "Registrer overtid",  icon: Clock,        variant: "default" },
  { href: "/avvik/ny",       label: "Meld avvik",         icon: ShieldAlert,  variant: "warning" },
  { href: "/varsling/ny",    label: "Varsle kritikkverdig forhold", icon: AlertTriangle, variant: "default" },
];

const secondaryActions: SecondaryAction[] = [
  { href: "/dokumenter", label: "Dokumenter",     icon: FolderOpen },
  { href: "/tiltak",     label: "Mine tiltak",    icon: Zap },
  { href: "/varsler",    label: "Varsler",        icon: Bell },
  { href: "/fravaer",    label: "Fraværshistorikk", icon: CalendarDays },
];

const primaryVariants = {
  warning: { tile: "border-yellow-300 bg-yellow-50",    icon: "text-yellow-700 bg-yellow-100", label: "text-yellow-800" },
  primary: { tile: "border-primary/30 bg-primary/5",   icon: "text-primary bg-primary/10",   label: "text-primary"   },
  default: { tile: "border-border bg-card hover:bg-accent/50", icon: "text-muted-foreground bg-muted", label: "text-foreground" },
};

export function EmployeeQuickActions() {
  return (
    <div className="space-y-3">
      {/* Primære */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Snarveier</h2>
      <div className="grid grid-cols-2 gap-3">
        {primaryActions.map(({ href, label, icon: Icon, variant, comingSoon }) => {
          const v = primaryVariants[variant];
          const inner = (
            <div className={cn(
              "flex flex-col items-start gap-3 rounded-2xl border p-4 min-h-[88px] transition-colors",
              v.tile,
              comingSoon && "opacity-70"
            )}>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", v.icon)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold leading-tight", v.label)}>{label}</p>
                {comingSoon && (
                  <p className="text-xs text-muted-foreground mt-0.5">Kommer snart</p>
                )}
              </div>
            </div>
          );

          return comingSoon || !href ? (
            <div key={label} aria-disabled className="cursor-not-allowed select-none">{inner}</div>
          ) : (
            <Link key={label} href={href} className="active:scale-[0.98]">{inner}</Link>
          );
        })}
      </div>

      {/* Sekundære */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {secondaryActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card py-3 px-2 text-center hover:bg-accent/50 transition-colors active:scale-[0.97] min-h-[44px]"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
