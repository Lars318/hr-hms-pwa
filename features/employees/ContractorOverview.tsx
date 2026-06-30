"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import {
  Briefcase, ShieldCheck, MapPin, ChevronRight, Loader2, Upload, Download, X,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type DocKind = "contract" | "selfDeclaration";

function DocControl({
  contractorId, kind, label, date, hasFile, onChanged,
}: {
  contractorId: string;
  kind: DocKind;
  label: string;
  date: Date | string | null;
  hasFile: boolean;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUploadUrl = trpc.profile.getContractorUploadUrl.useMutation();
  const setFile = trpc.profile.setContractorFile.useMutation();
  const getFileUrl = trpc.profile.getContractorFileUrl.useMutation();
  const setDoc = trpc.profile.setContractorDoc.useMutation();

  const dateField = kind === "contract" ? "contractSignedAt" : "selfDeclarationAt";

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { signedUrl, filePath } = await getUploadUrl.mutateAsync({
        id: contractorId, kind, fileName: file.name, sizeBytes: file.size,
      });
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!res.ok) throw new Error("Opplasting feilet.");
      await setFile.mutateAsync({ id: contractorId, kind, filePath });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved opplasting.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const { signedUrl } = await getFileUrl.mutateAsync({ id: contractorId, kind });
      window.open(signedUrl, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke åpne fil.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await setDoc.mutateAsync({ id: contractorId, field: dateField, received: false });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const received = !!date;

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*,.doc,.docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground w-28">{label}</span>
        {hasFile ? (
          <>
            <button
              type="button" disabled={busy} onClick={download}
              className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 text-green-700 px-2.5 py-1.5 text-xs font-medium hover:bg-green-100 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Last ned
            </button>
            <button
              type="button" disabled={busy} onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Bytt
            </button>
            <button
              type="button" disabled={busy} onClick={remove}
              className="inline-flex items-center justify-center rounded-lg border border-border h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
              aria-label="Fjern"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button" disabled={busy} onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Last opp
          </button>
        )}
      </div>
      {received && hasFile && (
        <span className="text-[10px] text-muted-foreground pl-[7.5rem]">
          Registrert {format(new Date(date!), "d. MMM yyyy", { locale: nb })}
        </span>
      )}
      {error && <span className="text-[10px] text-destructive pl-[7.5rem]">{error}</span>}
    </div>
  );
}

export function ContractorOverview() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.profile.contractors.useQuery();
  const refresh = () => utils.profile.contractors.invalidate();

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

            <div className="flex flex-col gap-2 border-t pt-3">
              <DocControl
                contractorId={c.id}
                kind="contract"
                label="Oppdragsavtale"
                date={c.contractSignedAt}
                hasFile={c.hasContractFile}
                onChanged={refresh}
              />
              <DocControl
                contractorId={c.id}
                kind="selfDeclaration"
                label="Egenerklæring"
                date={c.selfDeclarationAt}
                hasFile={c.hasSelfDeclarationFile}
                onChanged={refresh}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
