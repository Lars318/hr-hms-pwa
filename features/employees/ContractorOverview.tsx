"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  Briefcase, CheckCircle2, XCircle, FileText, ShieldCheck, MapPin, ChevronRight, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

function StatusToggle({
  label, icon: Icon, date, onToggle, pending,
}: {
  label: string;
  icon: React.ElementType;
  date: Date | string | null;
  onToggle: (received: boolean) => void;
  pending: boolean;
}) {
  const received = !!date;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onToggle(!received)}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        received
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
      )}
      title={received ? `Registrert ${format(new Date(date!), "d. MMM yyyy", { locale: nb })} — klikk for å fjerne` : "Klikk for å markere som mottatt"}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
      {received ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 opacity-50" />}
    </button>
  );
}

export function ContractorOverview() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.profile.contractors.useQuery();
  const setDoc = trpc.profile.setContractorDoc.useMutation({
    onSuccess: () => utils.profile.contractors.invalidate(),
  });

  if (isLoading) {
    return <div className="rounded-2xl border bg-muted/40 h-48 animate-pulse" />;
  }

  const contractors = data?.contractors ?? [];
  const totalDocs = data?.totalDocs ?? 0;

  if (contractors.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
        <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="font-medium">Ingen selvstendig næringsdrivende registrert</p>
        <p className="text-sm text-muted-foreground">
          Marker ansatte som «Selvstendig næringsdrivende» i ansattlista, så dukker de opp her.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contractors.map((c) => {
        const isPending = setDoc.isPending && setDoc.variables?.id === c.id;
        return (
          <div key={c.id} className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/ansatte/${c.id}`} className="font-semibold hover:underline inline-flex items-center gap-1">
                  {c.fullName}
                  {c.status !== "ACTIVE" && <span className="text-xs text-muted-foreground">(inaktiv)</span>}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  {[c.title, c.email].filter(Boolean).join(" · ")}
                </p>
                {c.location && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {c.location.city ?? c.location.name}
                  </p>
                )}
              </div>
              {/* HMS-bekreftelser */}
              <div className="shrink-0 text-right">
                <div className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  totalDocs > 0 && c.confirmedDocs >= totalDocs
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {c.confirmedDocs}/{totalDocs} HMS-dok.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusToggle
                label="Oppdragsavtale"
                icon={FileText}
                date={c.contractSignedAt}
                pending={isPending && setDoc.variables?.field === "contractSignedAt"}
                onToggle={(received) => setDoc.mutate({ id: c.id, field: "contractSignedAt", received })}
              />
              <StatusToggle
                label="Egenerklæring"
                icon={FileText}
                date={c.selfDeclarationAt}
                pending={isPending && setDoc.variables?.field === "selfDeclarationAt"}
                onToggle={(received) => setDoc.mutate({ id: c.id, field: "selfDeclarationAt", received })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
