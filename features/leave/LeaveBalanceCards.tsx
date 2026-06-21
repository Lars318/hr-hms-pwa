"use client";

import { trpc } from "@/lib/trpc/client";
import { CalendarDays, HeartHandshake, FileCheck } from "lucide-react";

function BalanceCard({
  icon: Icon,
  label,
  remaining,
  total,
  unit,
  subtitle,
  variant,
  mode = "remaining",
}: {
  icon: React.ElementType;
  label: string;
  remaining: number;
  total: number;
  unit: string;
  subtitle?: string;
  variant: "primary" | "accent" | "muted";
  mode?: "remaining" | "used";
}) {
  // mode="remaining": remaining er hva som er igjen → brukt = total - remaining
  // mode="used":      remaining er hva som er brukt → brukt = remaining
  const used = mode === "used" ? remaining : total - remaining;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  const iconStyles = {
    primary: "bg-primary/15 text-primary",
    accent:  "bg-accent/15 text-accent",
    muted:   "bg-muted-foreground/15 text-muted-foreground",
  }[variant];

  const barStyles = {
    primary: "bg-primary",
    accent:  "bg-accent",
    muted:   "bg-muted-foreground",
  }[variant];

  return (
    <div className="rounded-2xl border bg-card p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${iconStyles}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground truncate">{label}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-2xl font-bold tracking-tight leading-none">{remaining}</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">/ {total} {unit}</span>
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{subtitle}</p>}
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-destructive" : barStyles}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LeaveBalanceCards() {
  const { data, isLoading } = trpc.leaveRequest.balance.useQuery({});

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-4 h-32 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const egenmeldingUsed = data.egenmelding.maxInstances - data.egenmelding.instancesRemaining;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 items-stretch">
      <BalanceCard
        icon={FileCheck}
        label="Egenmelding"
        remaining={egenmeldingUsed}
        total={data.egenmelding.maxInstances}
        unit="brukt"
        subtitle={`${data.egenmelding.daysUsed} av ${data.egenmelding.maxInstances * data.egenmelding.daysPerInstance} dager`}
        variant="accent"
        mode="used"
      />
      <BalanceCard
        icon={HeartHandshake}
        label="Omsorgsfravær"
        remaining={data.omsorgsfravær.daysRemaining}
        total={data.omsorgsfravær.quota}
        unit="dager"
        variant="primary"
      />
      <BalanceCard
        icon={CalendarDays}
        label="Ferie"
        remaining={data.ferie.daysRemaining}
        total={data.ferie.quota}
        unit="dager"
        variant="muted"
      />
    </div>
  );
}
