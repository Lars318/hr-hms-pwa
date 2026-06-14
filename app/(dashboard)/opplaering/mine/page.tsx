import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { GraduationCap, CheckCircle2, AlertTriangle, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export const metadata = { title: "Mine opplæringer – HR/HMS" };

export default async function MineOpplaeringerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const records = await db.trainingRecord.findMany({
    where: { profileId: profile.id },
    include: {
      course: {
        select: { id: true, name: true, category: true, isRequired: true, validityMonths: true, location: { select: { name: true } } },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  // Hent også obligatoriske kurs ansatt IKKE har fullført
  const allRequired = await db.trainingCourse.findMany({
    where: { isRequired: true, status: "ACTIVE" },
    select: { id: true, name: true, category: true, location: { select: { name: true } } },
  });
  const completedCourseIds = new Set(records.map((r) => r.courseId));
  const missing = allRequired.filter((c) => !completedCourseIds.has(c.id));

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const enriched = records.map((r) => ({
    ...r,
    isExpired: r.expiresAt ? r.expiresAt < now : false,
    isExpiringSoon: r.expiresAt ? r.expiresAt > now && r.expiresAt < soonThreshold : false,
  }));

  const expiredCount = enriched.filter((r) => r.isExpired).length;
  const expiringSoonCount = enriched.filter((r) => r.isExpiringSoon).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/opplaering"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Mine opplæringer
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dine registrerte HMS-opplæringer og sertifiseringer.
        </p>
      </div>

      {/* Statusoversikt */}
      {(expiredCount > 0 || expiringSoonCount > 0 || missing.length > 0) && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4 space-y-2">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Krever oppfølging</p>
          {missing.length > 0 && (
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {missing.length} obligatorisk{missing.length > 1 ? "e" : ""} kurs mangler
            </p>
          )}
          {expiredCount > 0 && (
            <p className="text-sm text-red-700 dark:text-red-300">
              {expiredCount} sertifisering{expiredCount > 1 ? "er" : ""} er utløpt
            </p>
          )}
          {expiringSoonCount > 0 && (
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {expiringSoonCount} sertifisering{expiringSoonCount > 1 ? "er" : ""} utløper innen 30 dager
            </p>
          )}
        </div>
      )}

      {/* Manglende obligatoriske */}
      {missing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Manglende obligatoriske kurs
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {missing.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category}{c.location ? ` · ${c.location.name}` : ""}</p>
                </div>
                <Badge variant="destructive" className="text-xs shrink-0">Mangler</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gjennomførte kurs */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Gjennomførte kurs ({records.length})
        </h2>
        {enriched.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-muted-foreground text-sm">
            Ingen opplæring er registrert på deg ennå.
            <br />Ta kontakt med din leder eller HMS-ansvarlig.
          </div>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {enriched.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{r.course.name}</p>
                    {r.course.isRequired && <Badge variant="outline" className="text-xs">Obligatorisk</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.course.category}{r.course.location ? ` · ${r.course.location.name}` : ""}
                  </p>
                  {r.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{r.notes}</p>}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Fullført: {format(new Date(r.completedAt), "d. MMM yyyy", { locale: nb })}
                  </p>
                  {r.expiresAt ? (
                    <p className={`text-xs flex items-center gap-1 justify-end ${r.isExpired ? "text-red-600" : r.isExpiringSoon ? "text-yellow-600" : "text-green-600"}`}>
                      {r.isExpired
                        ? <><AlertTriangle className="h-3 w-3" />Utløpt {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</>
                        : r.isExpiringSoon
                        ? <><Clock className="h-3 w-3" />Utløper {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</>
                        : <><CheckCircle2 className="h-3 w-3" />Gyldig til {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</>
                      }
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="h-3 w-3" />Ingen utløpsdato
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
