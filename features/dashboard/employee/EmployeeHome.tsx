"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import {
  CalendarPlus, ShieldAlert, Clock, BookOpen, ChevronRight, Award, CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { HomeHeader } from "@/features/dashboard/home/HomeHeader";
import { AnnouncementCard, NewsRow } from "@/features/dashboard/home/NewsCards";

const QUICK_ACTIONS = [
  { href: "/fravaer/ny?type=EGENMELDING", label: "Egenmelding", icon: CalendarPlus },
  { href: "/avvik/ny", label: "Avvik", icon: ShieldAlert },
  { href: "/overtid/ny", label: "Overtid", icon: Clock },
  { href: "/personalhandbok", label: "Håndbok", icon: BookOpen },
];

export function EmployeeHome({ profileId, fullName, avatarUrl }: {
  profileId: string; fullName: string; avatarUrl: string | null;
}) {
  const { data: balance } = trpc.leaveRequest.balance.useQuery({});
  const { data: overview } = trpc.profile.myOverview.useQuery();
  const { data: certs = [] } = trpc.certification.listForProfile.useQuery({ profileId });

  const handbookUnread =
    overview?.employmentType !== "SELF_EMPLOYED" &&
    overview?.handbook.version != null &&
    overview?.handbook.read === false;

  // Nærmeste sertifikat som utløper innen 30 dager (eller er utløpt)
  const expiringCert = certs
    .filter((c) => c.expiresAt && differenceInCalendarDays(new Date(c.expiresAt), new Date()) <= 30)
    .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];

  return (
    <div className="space-y-5 pb-4">
      <HomeHeader fullName={fullName} avatarUrl={avatarUrl} />

      {/* Fokuskort — rolig status */}
      {handbookUnread ? (
        <Link href="/personalhandbok" className="block rounded-3xl bg-primary p-6 text-primary-foreground active:scale-[0.99] transition-transform">
          <p className="text-xs opacity-75">I dag</p>
          <p className="mt-1.5 text-lg font-semibold leading-snug">Personalhåndboken er oppdatert</p>
          <p className="mt-1 text-sm opacity-80">Bekreft at du har lest versjon {overview?.handbook.version}.</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-medium">
            Les håndbok <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-xs opacity-75">I dag</p>
          <p className="mt-1.5 text-lg font-semibold leading-snug">Alt er i rute</p>
          <p className="mt-1 text-sm opacity-80">Ingenting venter på deg akkurat nå.</p>
        </div>
      )}

      {/* Fersk kunngjøring (kun hvis nylig) */}
      <AnnouncementCard />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Venstre kolonne */}
        <div className="space-y-5">
          {/* Saldo */}
          <div className="grid grid-cols-3 rounded-2xl border bg-card py-4">
            <SaldoCell value={balance ? `${balance.ferie.daysRemaining}` : "–"} label="feriedager" border />
            <SaldoCell value={balance ? `${balance.egenmelding.instancesRemaining}` : "–"} sub={balance ? `/${balance.egenmelding.maxInstances}` : ""} label="egenmelding" border />
            <SaldoCell value={balance ? `${balance.omsorgsfravær.daysRemaining}` : "–"} label="omsorg" />
          </div>

          {/* Snarveier */}
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-2 active:scale-[0.97] transition-transform">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border bg-card">
                  <Icon className="h-[22px] w-[22px] text-primary" />
                </span>
                <span className="text-[11px] text-muted-foreground text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Høyre kolonne */}
        <div className="space-y-5">
          <NewsRow />

          {/* Myk påminnelse: sertifikat */}
          {expiringCert && (
            <Link
              href="/profil"
              className="flex items-center gap-3 rounded-2xl border border-l-[3px] border-l-accent bg-card px-4 py-3.5 active:scale-[0.99] transition-transform"
            >
              <Award className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{expiringCert.name} utløper snart</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const d = differenceInCalendarDays(new Date(expiringCert.expiresAt!), new Date());
                    return d < 0 ? "Utløpt" : `${d} dager igjen`;
                  })()}
                </p>
              </div>
              <ChevronRight className="h-[18px] w-[18px] text-muted-foreground/50" />
            </Link>
          )}

          {/* Håndbok bekreftet (rolig kvittering) */}
          {!handbookUnread && overview?.handbook.read && (
            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Personalhåndbok bekreftet lest
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaldoCell({ value, sub, label, border }: { value: string; sub?: string; label: string; border?: boolean }) {
  return (
    <div className={cn("text-center", border && "border-r border-border")}>
      <p className="text-[22px] font-semibold leading-none">
        {value}{sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
