"use client";

import Link from "next/link";
import { CalendarDays, ClipboardList, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { LeaveBalanceCards } from "@/features/leave/LeaveBalanceCards";

function NextLeaveCard() {
  const { data, isLoading } = trpc.leaveRequest.list.useQuery({ status: "APPROVED" });

  if (isLoading) {
    return <div className="rounded-2xl border bg-card p-4 h-24 animate-pulse bg-muted/40" />;
  }

  const today = new Date();
  const upcoming = (data ?? [])
    .filter((r) => new Date(r.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const next = upcoming[0];

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <CalendarDays className="h-4 w-4" />
        <p className="text-sm font-semibold">Neste ferie</p>
      </div>
      {next ? (
        <div className="space-y-0.5">
          <p className="text-base font-bold">
            {new Date(next.startDate).toLocaleDateString("nb-NO", {
              day: "numeric",
              month: "long",
            })}
            {" – "}
            {new Date(next.endDate).toLocaleDateString("nb-NO", {
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-xs text-muted-foreground">{next.days} dag{next.days !== 1 ? "er" : ""} · godkjent</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen kommende ferie registrert</p>
      )}
    </div>
  );
}

function MyTasksCard() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <ClipboardList className="h-4 w-4" />
        <p className="text-sm font-semibold">Mine oppgaver</p>
      </div>
      <p className="text-sm text-muted-foreground">Ingen aktive oppgaver</p>
    </div>
  );
}

function QuickEgenmeldingButton() {
  return (
    <Link
      href="/fravaer/ny?type=EGENMELDING"
      className="flex items-center gap-2 rounded-2xl border bg-primary/10 text-primary px-4 py-3 text-sm font-medium hover:bg-primary/20 transition-colors w-full sm:w-auto"
    >
      <Plus className="h-4 w-4" />
      Registrer egenmelding
    </Link>
  );
}

export function NewEmployeeDashboard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Hurtigknapp egenmelding */}
      <div>
        <QuickEgenmeldingButton />
      </div>

      {/* Fraværsbalanse */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Fraværsoversikt</h2>
        <LeaveBalanceCards />
      </section>

      {/* Neste ferie + Mine oppgaver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NextLeaveCard />
        <MyTasksCard />
      </div>
    </div>
  );
}
