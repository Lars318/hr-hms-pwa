"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import type { ActionStatus } from "@prisma/client";
import { ACTION_STATUS_LABELS } from "@/lib/risk";

interface ActionStatusChangerProps {
  actionId: string;
  currentStatus: ActionStatus;
}

const allStatuses: ActionStatus[] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];

export function ActionStatusChanger({ actionId, currentStatus }: ActionStatusChangerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<ActionStatus>(currentStatus);

  const changeMutation = trpc.action.changeStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  const hasChanged = selectedStatus !== currentStatus;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm">Endre status</h2>
      <div className="flex items-center gap-3">
        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ActionStatus)}
          className="w-48"
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>{ACTION_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Button
          disabled={!hasChanged || changeMutation.isPending}
          onClick={() => changeMutation.mutate({ id: actionId, status: selectedStatus })}
        >
          {changeMutation.isPending ? "Lagrer…" : "Oppdater status"}
        </Button>
      </div>
      {changeMutation.error && <p className="text-sm text-destructive">{changeMutation.error.message}</p>}
    </div>
  );
}
