"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  Flame, Zap, ShieldCheck, Truck, FlaskConical, ClipboardList,
  ChevronRight, CheckCircle2, AlertTriangle, XCircle, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { InternkontrollAarshjul } from "./InternkontrollAarshjul";

const KATEGORI_META: Record<string, { label: string; icon: React.ElementType; href: string }> = {
  BRANNVERN:    { label: "Brannvern",      icon: Flame,         href: "/internkontroll/brannvern" },
  EL_SIKKERHET: { label: "El-sikkerhet",   icon: Zap,           href: "/internkontroll/el-sikkerhet" },
  ARBEIDSMILJO: { label: "Arbeidsmiljø",   icon: ShieldCheck,   href: "/internkontroll/arbeidsmiljo" },
  KJORETOY:     { label: "Kjøretøy",       icon: Truck,         href: "/internkontroll/kjoretoy" },
  STOFFKARTOTEK:{ label: "Stoffkartotek",  icon: FlaskConical,  href: "/kjemikalier" },
  ANNET:        { label: "Annet",          icon: ClipboardList, href: "/internkontroll/annet" },
};

const STATUS_META = {
  OK:              { label: "OK",              color: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2,   dot: "bg-green-500" },
  FORFALLER_SNART: { label: "Forfaller snart", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock,         dot: "bg-yellow-500" },
  FORFALT:         { label: "Forfalt",         color: "bg-red-100 text-red-700 border-red-200",         icon: XCircle,       dot: "bg-red-500" },
  IKKE_SATT:       { label: "Ikke registrert", color: "bg-muted text-muted-foreground border-border",   icon: AlertTriangle, dot: "bg-muted-foreground" },
};

export function InternkontrollDashboard() {
  const { data: omrader, isLoading } = trpc.internkontroll.listeOmrader.useQuery();
  const { data: oversikt } = trpc.internkontroll.statusOversikt.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 h-36 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fagmoduler — dedikerte moduler med egne sjekklister */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/internkontroll/brannvern", label: "Brannvern", desc: "Rømningsveier, slokkeutstyr, brannøvelse", icon: Flame },
          { href: "/internkontroll/el-sikkerhet", label: "El-sikkerhet", desc: "El-kontroll, termografering, dokumentasjon", icon: Zap },
          { href: "/internkontroll/arbeidsmiljo", label: "Arbeidsmiljø", desc: "Vernerunde, ergonomi, psykososialt", icon: ShieldCheck },
        ].map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow active:scale-[0.99] flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Statusoppsummering */}
      {oversikt && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "OK", value: oversikt.ok, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Forfaller snart", value: oversikt.forfaller, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
            { label: "Forfalt", value: oversikt.forfalt, color: "text-red-600", bg: "bg-red-50 border-red-200" },
            { label: "Ikke registrert", value: oversikt.ikkeSatt, color: "text-muted-foreground", bg: "bg-muted/30 border-border" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("rounded-xl border p-3 text-center", bg)}>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Områdekort */}
      {!omrader?.length ? (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="font-medium">Ingen internkontroll-områder registrert</p>
          <p className="text-sm text-muted-foreground">Legg til brannvern, el-sikkerhet og andre lovpålagte områder.</p>
          <Link
            href="/internkontroll/ny"
            className="inline-flex mt-2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Legg til område
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {omrader.map((omrade) => {
            const meta = KATEGORI_META[omrade.kategori] ?? KATEGORI_META.ANNET;
            const statusMeta = STATUS_META[omrade.status];
            const Icon = meta.icon;
            const StatusIcon = statusMeta.icon;

            return (
              <Link
                key={omrade.id}
                href={`/internkontroll/${omrade.id}`}
                className="rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow active:scale-[0.99] flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{omrade.tittel}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>

                <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium w-fit", statusMeta.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusMeta.label}
                </div>

                {omrade.sisteLogg && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Sist: {format(new Date(omrade.sisteLogg.utfortDato), "d. MMM yyyy", { locale: nb })}</p>
                    {omrade.dagerTilFrist !== null && (
                      <p>
                        {omrade.dagerTilFrist < 0
                          ? `Forfalt for ${Math.abs(omrade.dagerTilFrist)} dager siden`
                          : `Neste frist om ${omrade.dagerTilFrist} dager`}
                      </p>
                    )}
                  </div>
                )}

                {omrade.ansvarlig && (
                  <p className="text-xs text-muted-foreground">Ansvarlig: {omrade.ansvarlig.fullName}</p>
                )}
              </Link>
            );
          })}

          <Link
            href="/internkontroll/ny"
            className="rounded-2xl border-2 border-dashed border-border bg-transparent p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors min-h-[140px]"
          >
            <ClipboardList className="h-6 w-6" />
            <span className="text-sm font-medium">Legg til område</span>
          </Link>
        </div>
      )}

      {/* Årshjul — visuell oversikt over når kontroller forfaller */}
      {!!omrader?.length && (
        <div className="pt-2">
          <InternkontrollAarshjul />
        </div>
      )}
    </div>
  );
}
