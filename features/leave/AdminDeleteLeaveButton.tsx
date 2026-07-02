"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function AdminDeleteLeaveButton({ requestId }: { requestId: string }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const del = trpc.leaveRequest.adminDelete.useMutation({
    onSuccess: () => {
      utils.leaveRequest.list.invalidate();
      setOpen(false);
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Slett fravær"
        title="Slett fravær (admin)"
      >
        {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Slett fravær"
        description={del.error?.message ?? "Dette sletter fraværet permanent, også hvis det er godkjent. Kan ikke angres."}
        confirmLabel="Slett"
        onConfirm={() => del.mutate({ id: requestId })}
        loading={del.isPending}
      />
    </>
  );
}
