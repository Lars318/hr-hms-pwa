import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft, CalendarDays, User, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { RegistrerKontrollForm } from "@/features/internkontroll/RegistrerKontrollForm";

export const dynamic = "force-dynamic";

const KATEGORI_LABEL: Record<string, string> = {
  BRANNVERN: "Brannvern", EL_SIKKERHET: "El-sikkerhet",
  ARBEIDSMILJO: "Arbeidsmiljø", KJORETOY: "Kjøretøy",
  STOFFKARTOTEK: "Stoffkartotek", ANNET: "Annet",
};

export default async function InternkontrollDetaljPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const omrade = await db.internkontrollOmrade.findUnique({
    where: { id: params.id },
    include: {
      ansvarlig: { select: { fullName: true } },
      logg: {
        orderBy: { utfortDato: "desc" },
        include: { utfortAv: { select: { fullName: true } } },
      },
    },
  });
  if (!omrade) notFound();

  const canEdit = ["ADMIN", "HR", "MANAGER"].includes(profile.role);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/internkontroll" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{omrade.tittel}</h1>
          <p className="text-sm text-muted-foreground">{KATEGORI_LABEL[omrade.kategori]} · Kontroll hver {omrade.intervalDager} dag</p>
        </div>
      </div>

      {omrade.beskrivelse && (
        <p className="text-sm text-muted-foreground">{omrade.beskrivelse}</p>
      )}

      {canEdit && <RegistrerKontrollForm omradeId={omrade.id} />}

      {/* Logg */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Kontrollhistorikk</h2>
        {omrade.logg.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Ingen kontroller registrert ennå
          </div>
        ) : (
          <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
            {omrade.logg.map((logg) => (
              <div key={logg.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${logg.godkjent ? "bg-green-100" : "bg-red-100"}`}>
                  {logg.godkjent
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${logg.godkjent ? "text-green-700" : "text-red-700"}`}>
                      {logg.godkjent ? "Godkjent" : "Avvik funnet"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(logg.utfortDato), "d. MMM yyyy", { locale: nb })}
                    </span>
                  </div>
                  {logg.merknad && <p className="text-sm text-muted-foreground mt-0.5">{logg.merknad}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{logg.utfortAv.fullName}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Neste: {format(new Date(logg.nesteFrist), "d. MMM yyyy", { locale: nb })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
