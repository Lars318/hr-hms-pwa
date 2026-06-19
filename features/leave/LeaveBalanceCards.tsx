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
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconStyles}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs text-muted-foreground text-right leading-tight">{label}</span>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">{remaining}</span>
          <span className="text-sm text-muted-foreground">av {total} {unit} igjen</span>
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
    <div className="grid grid-cols-3 gap-3">
      <BalanceCard
        icon={FileCheck}
        label="Egenmelding"
        remaining={data.egenmelding.instancesRemaining}
        total={data.egenmelding.maxInstances}
        unit="egenmeldinger"
        subtitle={`${data.egenmelding.daysUsed} av ${data.egenmelding.maxInstances * data.egenmelding.daysPerInstance} dager`}
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
