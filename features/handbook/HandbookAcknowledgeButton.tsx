"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Props {
  versionId: string;
}

export function HandbookAcknowledgeButton({ versionId }: Props) {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const ack = trpc.handbook.acknowledge.useMutation({
    onSuccess: () => {
      utils.handbook.myAcknowledgement.invalidate();
      utils.handbook.readStatus.invalidate();
      success("Bekreftelse registrert – takk!");
    },
    onError: (err) => toastError(err.message),
  });

  return (
    <Button
      onClick={() => ack.mutate({ versionId })}
      disabled={ack.isPending}
      className="min-h-[44px] gap-2"
    >
      <CheckCircle className="h-4 w-4" />
      {ack.isPending ? "Bekrefter…" : "Bekreft at jeg har lest"}
    </Button>
  );
}
