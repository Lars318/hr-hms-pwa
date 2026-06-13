"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LeaveDecisionFormProps {
  requestId: string;
  employeeName: string;
}

export function LeaveDecisionForm({ requestId, employeeName }: LeaveDecisionFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [comment, setComment] = useState("");
  const { success, error: toastError } = useToast();

  const approveMutation = trpc.leaveRequest.approve.useMutation({
    onSuccess: () => {
      utils.leaveRequest.byId.invalidate({ id: requestId });
      utils.leaveRequest.list.invalidate();
      success("Søknad godkjent!");
      router.refresh();
    },
    onError: (err) => toastError(err.message),
  });

  const rejectMutation = trpc.leaveRequest.reject.useMutation({
    onSuccess: () => {
      utils.leaveRequest.byId.invalidate({ id: requestId });
      utils.leaveRequest.list.invalidate();
      success("Søknad avslått.");
      router.refresh();
    },
    onError: (err) => toastError(err.message),
  });

  const error = approveMutation.error?.message ?? rejectMutation.error?.message;
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">Behandle søknad fra {employeeName}</p>

      <div className="space-y-1">
        <Label htmlFor="manager-comment">Kommentar (valgfritt)</Label>
        <Textarea
          id="manager-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Legg til en kommentar til den ansatte…"
          maxLength={500}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button
          onClick={() => approveMutation.mutate({ id: requestId, managerComment: comment || undefined })}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {approveMutation.isPending ? "Godkjenner…" : "Godkjenn"}
        </Button>
        <Button
          variant="outline"
          onClick={() => rejectMutation.mutate({ id: requestId, managerComment: comment || undefined })}
          disabled={isPending}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          {rejectMutation.isPending ? "Avslår…" : "Avslå"}
        </Button>
      </div>
    </div>
  );
}
