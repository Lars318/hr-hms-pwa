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
}: {
  icon: React.ElementType;
  label: string;
  remaining: number;
  total: number;
  unit: string;
  subtitle?: string;
  variant: "primary" | "accent" | "muted";
}) {
  const pct = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;

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
    <div className="rounded-2xl border bg-card p-3 sm:p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${iconStyles}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-muted-foreground leading-tight">{label}</span>
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">{remaining}</span>
          <span className="text-xs text-muted-foreground">/ {total} {unit}</span>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
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

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <BalanceCard
        icon={FileCheck}
        label="Egenmelding"
        remaining={data.egenmelding.instancesRemaining}
        total={data.egenmelding.maxInstances}
        unit="gang"
        subtitle={`${data.egenmelding.daysUsed} av ${data.egenmelding.maxInstances * data.egenmelding.daysPerInstance} dager brukt`}
        variant="accent"
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
