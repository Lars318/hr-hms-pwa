"use client";

import { trpc } from "@/lib/trpc/client";
import { CalendarDays, HeartHandshake, ClipboardList } from "lucide-react";

function BalanceCard({
  icon: Icon,
  label,
  used,
  total,
  unit,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  used: number;
  total: number;
  unit: string;
  subtitle?: string;
  color: string;
}) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`rounded-xl p-1.5 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{remaining}</span>
          <span className="text-xs text-muted-foreground mb-1">av {total} {unit} igjen</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function LeaveBalanceCards() {
  const { data, isLoading } = trpc.leaveRequest.balance.useQuery({});

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-card p-4 h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BalanceCard
        icon={ClipboardList}
        label="Egenmelding"
        used={data.egenmelding.instancesUsed}
        total={data.egenmelding.maxInstances}
        unit="instanser"
        subtitle={`${data.egenmelding.daysUsed} av ${data.egenmelding.maxInstances * data.egenmelding.daysPerInstance} dager brukt`}
        color="bg-accent/10 text-accent-foreground"
      />
      <BalanceCard
        icon={HeartHandshake}
        label="Omsorgsfravær"
        used={data.omsorgsfravær.daysUsed}
        total={data.omsorgsfravær.quota}
        unit="dager"
        color="bg-muted text-muted-foreground"
      />
      <BalanceCard
        icon={CalendarDays}
        label="Ferie"
        used={data.ferie.daysUsed}
        total={data.ferie.quota}
        unit="dager"
        color="bg-primary/10 text-primary"
      />
    </div>
  );
}
