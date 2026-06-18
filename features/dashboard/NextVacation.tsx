"use client";

import { trpc } from "@/lib/trpc/client";
import { CalendarDays } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

export function NextVacation() {
  const { data: leaves = [] } = trpc.leaveRequest.list.useQuery(
    { status: "APPROVED" },
    { staleTime: 60_000 }
  );

  const now = new Date();
  const nextVacation = leaves
    .filter((l) => l.type === "VACATION" && new Date(l.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  if (!nextVacation) return null;

  const daysUntil = differenceInDays(new Date(nextVacation.startDate), now);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
      <CalendarDays className="h-5 w-5 text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Neste ferie om {daysUntil === 0 ? "i dag" : `${daysUntil} dag${daysUntil !== 1 ? "er" : ""}`}
        </p>
        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
          {format(new Date(nextVacation.startDate), "d. MMM", { locale: nb })}
          {" – "}
          {format(new Date(nextVacation.endDate), "d. MMM yyyy", { locale: nb })}
          {" · "}
          {nextVacation.days} dag{nextVacation.days !== 1 ? "er" : ""}
        </p>
      </div>
    </div>
  );
}
