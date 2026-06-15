"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { PenLine, CheckCircle2, XCircle } from "lucide-react";

type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

interface SignatureReq {
  id: string;
  status: "PENDING" | "SIGNED" | "REJECTED" | "EXPIRED";
  signedAt: Date | null;
  expiresAt: Date | null;
  signer: { fullName: string; email: string };
}

interface Props {
  contractId: string;
  employeeId: string;
  role: Role;
  currentProfileId: string;
  initialRequests: SignatureReq[];
}

const STATUS_CONFIG = {
  PENDING: { label: "Venter på signatur", variant: "outline" as const },
  SIGNED: { label: "Signert", variant: "default" as const },
  REJECTED: { label: "Avslått", variant: "destructive" as const },
  EXPIRED: { label: "Utløpt", variant: "secondary" as const },
};

export function SignaturePanel({ contractId, employeeId, role, currentProfileId, initialRequests }: Props) {
  const router = useRouter();
  const isHrAdmin = role === "ADMIN" || role === "HR";

  const { data: requests, refetch } = trpc.signature.listForContract.useQuery(contractId, {
    enabled: isHrAdmin,
  });

  const displayRequests = isHrAdmin ? (requests ?? initialRequests) : initialRequests;
  const myPending = displayRequests.filter((r) => r.status === "PENDING" && !isHrAdmin);

  const requestSig = trpc.signature.requestSignature.useMutation({
    onSuccess: () => { refetch(); router.refresh(); },
  });
  const sign = trpc.signature.sign.useMutation({
    onSuccess: () => router.refresh(),
  });
  const reject = trpc.signature.reject.useMutation({
    onSuccess: () => router.refresh(),
  });

  const hasPending = displayRequests.some((r) => r.status === "PENDING");
  const hasSigned = displayRequests.some((r) => r.status === "SIGNED");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <PenLine className="h-4 w-4" />E-signering
          <span className="text-xs font-normal text-muted-foreground">(testmodus — ingen ekte signatur)</span>
        </h2>
        {isHrAdmin && !hasPending && !hasSigned && (
          <Button size="sm" variant="outline" disabled={requestSig.isPending}
            onClick={() => requestSig.mutate({ contractId, signerId: employeeId })}>
            {requestSig.isPending ? "..." : "Be om signatur"}
          </Button>
        )}
      </div>

      {displayRequests.length === 0 && (
        <p className="text-sm text-muted-foreground">Ingen signeringsforespørsler ennå.</p>
      )}

      {displayRequests.map((r) => {
        const cfg = STATUS_CONFIG[r.status];
        const isMyRequest = r.status === "PENDING" && !isHrAdmin;
        return (
          <div key={r.id} className="rounded-lg border px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">{r.signer.fullName}</p>
              <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
            </div>
            {r.signedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Signert {format(new Date(r.signedAt), "d. MMM yyyy HH:mm", { locale: nb })}
              </p>
            )}
            {r.expiresAt && r.status === "PENDING" && (
              <p className="text-xs text-muted-foreground">
                Utløper {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}
              </p>
            )}
            {isMyRequest && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={sign.isPending}
                  onClick={() => sign.mutate(r.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {sign.isPending ? "..." : "Signer (testmodus)"}
                </Button>
                <Button size="sm" variant="outline" disabled={reject.isPending}
                  onClick={() => reject.mutate(r.id)}>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  {reject.isPending ? "..." : "Avslå"}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {requestSig.isError && (
        <p className="text-sm text-destructive">{requestSig.error.message}</p>
      )}
    </div>
  );
}
