"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function CancelLeaveButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const cancelMutation = trpc.leaveRequest.cancel.useMutation({
    onSuccess: () => {
      utils.leaveRequest.byId.invalidate({ id: requestId });
      utils.leaveRequest.list.invalidate();
      router.refresh();
    },
  });

  return (
    <div>
      {cancelMutation.error && (
        <p className="mb-2 text-sm text-destructive">{cancelMutation.error.message}</p>
      )}
      <Button
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
        disabled={cancelMutation.isPending}
        onClick={() => cancelMutation.mutate({ id: requestId })}
      >
        <X className="h-4 w-4 mr-2" />
        {cancelMutation.isPending ? "Kansellerer…" : "Kanseller søknad"}
      </Button>
    </div>
  );
}
