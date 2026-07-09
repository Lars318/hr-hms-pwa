"use client";

import { format, differenceInCalendarDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  CalendarDays, Clock, HeartPulse, FileText, ShieldCheck, BookOpen,
  Download, Award, ExternalLink, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/features/employees/CertificationSection";

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof CalendarDays; label: string; value: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function certBadge(expiresAt: Date | null) {
  if (!expiresAt) return { label: "Uten utløp", cls: "bg-muted text-muted-foreground" };
  const days = differenceInCalendarDays(new Date(expiresAt), new Date());
  if (days < 0) return { label: "Utløpt", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days} d igjen`, cls: "bg-amber-100 text-amber-700" };
  return { label: "Gyldig", cls: "bg-emerald-100 text-emerald-700" };
}

export function MyOverview({ profileId }: { profileId: string }) {
  const { data: balance } = trpc.leaveRequest.balance.useQuery({});
  const { data: overview } = trpc.profile.myOverview.useQuery();
  const { data: certs = [] } = trpc.certification.listForProfile.useQuery({ profileId });

  const fileUrl = trpc.profile.myFileUrl.useMutation({
    onSuccess: (r) => window.open(r.signedUrl, "_blank"),
  });

  const isSelfEmployed = overview?.employmentType === "SELF_EMPLOYED";

  return (
    <div className="flex flex-col gap-3">
      {/* Feriesaldo */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Saldo</p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={CalendarDays}
            label="Feriedager"
            value={balance ? `${balance.ferie.daysRemaining}` : "–"}
            sub={balance ? `av ${balance.ferie.quota}` : undefined}
          />
          <StatCard
            icon={HeartPulse}
            label="Egenmelding"
            value={balance ? `${balance.egenmelding.instancesRemaining}` : "–"}
            sub={balance ? `av ${balance.egenmelding.maxInstances}` : undefined}
          />
          <StatCard
            icon={Clock}
            label="Omsorg"
            value={balance ? `${balance.omsorgsfravær.daysRemaining}` : "–"}
            sub={balance ? `av ${balance.omsorgsfravær.quota}` : undefined}
          />
        </div>
      </div>

      {/* Mine dokumenter */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Mine dokumenter</p>
        <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
          <DocRow
            icon={FileText}
            label={isSelfEmployed ? "Oppdragsavtale" : "Arbeidskontrakt"}
            done={!!overview?.contractSignedAt}
            doneText={overview?.contractSignedAt ? `Signert ${format(new Date(overview.contractSignedAt), "d. MMM yyyy", { locale: nb })}` : "Ikke registrert"}
            canDownload={!!overview?.hasContractFile}
            downloading={fileUrl.isPending && fileUrl.variables?.kind === "contract"}
            onDownload={() => fileUrl.mutate({ kind: "contract" })}
          />
          <DocRow
            icon={ShieldCheck}
            label="Egenerklæring"
            done={!!overview?.selfDeclarationAt}
            doneText={overview?.selfDeclarationAt ? `Mottatt ${format(new Date(overview.selfDeclarationAt), "d. MMM yyyy", { locale: nb })}` : "Ikke registrert"}
            canDownload={!!overview?.hasSelfDeclarationFile}
            downloading={fileUrl.isPending && fileUrl.variables?.kind === "selfDeclaration"}
            onDownload={() => fileUrl.mutate({ kind: "selfDeclaration" })}
          />
          {!isSelfEmployed && (
            <a href="/personalhandbok" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Personalhåndbok{overview?.handbook.version ? ` v${overview.handbook.version}` : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {overview?.handbook.read ? "Bekreftet lest" : "Ikke bekreftet lest"}
                </p>
              </div>
              {overview?.handbook.read ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium">Les nå</span>
              )}
            </a>
          )}
          {overview?.payrollUrl && (
            <a href={overview.payrollUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">Lønnsslipper</span>
              <span className="text-xs text-muted-foreground">Åpne lønnssystem</span>
            </a>
          )}
        </div>
      </div>

      {/* Mine sertifikater */}
      {certs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Mine sertifikater</p>
          <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
            {certs.map((c) => {
              const badge = certBadge(c.expiresAt);
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[c.category] ?? c.category}
                      {c.expiresAt ? ` · utløper ${format(new Date(c.expiresAt), "d. MMM yyyy", { locale: nb })}` : ""}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", badge.cls)}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DocRow({ icon: Icon, label, done, doneText, canDownload, downloading, onDownload }: {
  icon: typeof FileText; label: string; done: boolean; doneText: string;
  canDownload: boolean; downloading: boolean; onDownload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{doneText}</p>
      </div>
      {canDownload ? (
        <button onClick={onDownload} disabled={downloading}
          className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          aria-label={`Last ned ${label}`}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        </button>
      ) : done ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
      )}
    </div>
  );
}
