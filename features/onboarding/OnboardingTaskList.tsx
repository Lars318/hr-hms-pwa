"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  dueDate: Date | null;
}

export function OnboardingTaskList({ tasks, processId }: { tasks: Task[]; processId: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const update = trpc.onboarding.updateTask.useMutation({
    onSuccess: () => { setUpdating(null); router.refresh(); },
    onError: () => setUpdating(null),
  });

  const toggle = (task: Task, action: "COMPLETED" | "SKIPPED") => {
    const newStatus = task.status === action ? "PENDING" : action;
    setUpdating(task.id);
    update.mutate({ id: task.id, status: newStatus });
  };

  const pending = tasks.filter((t) => t.status === "PENDING");
  const done = tasks.filter((t) => t.status !== "PENDING");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggle} loading={updating === task.id} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Fullførte</p>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggle} loading={updating === task.id} />
          ))}
        </div>
      )}
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">Ingen oppgaver registrert.</p>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  loading,
}: {
  task: Task;
  onToggle: (task: Task, action: "COMPLETED" | "SKIPPED") => void;
  loading: boolean;
}) {
  const isDone = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border px-4 py-3",
      isDone && "opacity-60",
      isSkipped && "opacity-40",
    )}>
      <button
        onClick={() => onToggle(task, "COMPLETED")}
        disabled={loading}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-600 transition-colors"
      >
        {isDone
          ? <CheckCircle2 className="h-5 w-5 text-green-600" />
          : <Circle className="h-5 w-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isDone && "line-through")}>{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
        )}
        {task.dueDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Frist: {new Date(task.dueDate).toLocaleDateString("nb-NO")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.isRequired && <Badge variant="outline" className="text-xs">Obligatorisk</Badge>}
        {!task.isRequired && task.status === "PENDING" && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
            onClick={() => onToggle(task, "SKIPPED")} disabled={loading}>
            <SkipForward className="h-3 w-3 mr-1" />Hopp over
          </Button>
        )}
        {isSkipped && <span className="text-xs text-muted-foreground">Hoppet over</span>}
      </div>
    </div>
  );
}
