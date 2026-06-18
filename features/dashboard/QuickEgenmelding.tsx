"use client";

import { useState } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { HeartPulse } from "lucide-react";

export function QuickEgenmelding() {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();
  const [done, setDone] = useState(false);

  const mutation = trpc.leaveRequest.create.useMutation({
    onSuccess: () => {
      utils.leaveRequest.list.invalidate();
      utils.leaveRequest.balance.invalidate();
      setDone(true);
      success("Egenmelding for i dag er registrert!");
    },
    onError: (err) => toastError(err.message),
  });

  const today = format(new Date(), "yyyy-MM-dd");

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 px-4 py-3">
        <HeartPulse className="h-5 w-5 text-teal-500 shrink-0" />
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
          Egenmelding registrert for i dag
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={() =>
        mutation.mutate({ type: "EGENMELDING", startDate: today, endDate: today })
      }
      disabled={mutation.isPending}
      className="w-full h-12 text-base gap-2 bg-teal-600 hover:bg-teal-700 text-white"
    >
      <HeartPulse className="h-5 w-5" />
      {mutation.isPending ? "Registrerer…" : "Jeg er syk i dag"}
    </Button>
  );
}
