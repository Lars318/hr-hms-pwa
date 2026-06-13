import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { ActionStatusBadge } from "@/features/actions/ActionStatusBadge";
import { ActionPriorityBadge } from "@/features/actions/ActionPriorityBadge";
import type { ActionStatus, ActionPriority } from "@prisma/client";

interface Action {
  id: string;
  title: string;
  status: ActionStatus;
  priority: ActionPriority;
  dueDate: Date | null;
  department: { name: string } | null;
}

interface DueActionsCardProps {
  actions: Action[];
  title?: string;
}

export function DueActionsCard({ actions, title = "Mine tiltak" }: DueActionsCardProps) {
  const now = new Date();

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border bg-card col-span-full">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen åpne tiltak</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card col-span-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link href="/tiltak" className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
      </div>
      <div className="divide-y">
        {actions.map((a) => {
          const isOverdue = a.dueDate && new Date(a.dueDate) < now;
          return (
            <Link key={a.id} href={`/tiltak/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.department?.name ?? "Ingen avdeling"}
                  {a.dueDate && (
                    <span className={isOverdue ? " · text-destructive font-medium" : ""}>
                      {" · Frist: "}{format(new Date(a.dueDate), "d. MMM", { locale: nb })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ActionPriorityBadge priority={a.priority} />
                <ActionStatusBadge status={a.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
