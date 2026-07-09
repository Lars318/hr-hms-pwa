"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { CheckSquare, AlertCircle, FileSignature, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  action: CheckSquare,
  signature: FileSignature,
  inspection: ClipboardCheck,
} as const;

const TYPE_LABELS = {
  action: "Tiltak",
  signature: "Signatur",
  inspection: "HMS-runde",
} as const;

export function MyTasksList() {
  const { data: tasks = [], isLoading } = trpc.dashboard.myTasks.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
        <CheckSquare className="h-8 w-8 opacity-30" />
        <p className="text-sm">Ingen åpne oppgaver</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const Icon = TYPE_ICONS[task.type];
        return (
          <Link
            key={task.id}
            href={task.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card px-4 min-h-[52px] transition-colors hover:bg-accent",
              task.overdue && "border-destructive/40 bg-destructive/5"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", task.overdue ? "text-destructive" : "text-muted-foreground")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{TYPE_LABELS[task.type]}</p>
            </div>
            {task.overdue && (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
