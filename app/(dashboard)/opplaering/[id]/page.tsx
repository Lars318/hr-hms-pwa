import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { GraduationCap, ArrowLeft, CheckCircle2, AlertTriangle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CourseRecordAdmin } from "@/features/training/CourseRecordAdmin";

export const metadata = { title: "Kursdetalj – HMS-opplæring" };

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";

  if (!isHrAdmin && !isManager) redirect("/opplaering");

  const course = await db.trainingCourse.findUnique({
    where: { id: params.id },
    include: {
      location: { select: { id: true, name: true } },
      records: {
        include: {
          profile: { select: { id: true, fullName: true, email: true, status: true } },
          registeredBy: { select: { id: true, fullName: true } },
        },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!course) notFound();

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const enrichedRecords = course.records.map((r) => ({
    ...r,
    isExpired: r.expiresAt ? r.expiresAt < now : false,
    isExpiringSoon: r.expiresAt ? r.expiresAt > now && r.expiresAt < soonThreshold : false,
  }));

  const expiredCount = enrichedRecords.filter((r) => r.isExpired).length;
  const expiringSoonCount = enrichedRecords.filter((r) => r.isExpiringSoon).length;
  const validCount = enrichedRecords.filter((r) => !r.isExpired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/opplaering"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{course.category}</span>
            {course.isRequired && <Badge variant="destructive" className="text-xs">Obligatorisk</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
          {course.description && (
            <p className="text-muted-foreground text-sm mt-1">{course.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            {course.location && <span>Lokasjon: {course.location.name}</span>}
            {course.validityMonths && <span>Gyldighet: {course.validityMonths} måneder</span>}
          </div>
        </div>
        {isHrAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/opplaering/admin?courseId=${course.id}`}>Registrer gjennomføring</Link>
          </Button>
        )}
      </div>

      {/* Statistikkort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">{validCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Gyldige</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">{expiringSoonCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Utløper snart</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">{expiredCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Utløpt</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold tracking-tight">{enrichedRecords.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Totalt</p>
        </div>
      </div>

      {/* Records */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Users className="h-4 w-4" /> Gjennomføringer
        </h2>
        {enrichedRecords.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-muted-foreground text-sm">
            Ingen registrerte gjennomføringer ennå.
          </div>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {enrichedRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground">{r.profile.email}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Fullført: {format(new Date(r.completedAt), "d. MMM yyyy", { locale: nb })}
                  </p>
                  {r.expiresAt && (
                    <p className={`text-xs ${r.isExpired ? "text-red-600" : r.isExpiringSoon ? "text-yellow-600" : "text-muted-foreground"}`}>
                      {r.isExpired ? (
                        <span className="flex items-center gap-1 justify-end"><AlertTriangle className="h-3 w-3" />Utløpt {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</span>
                      ) : r.isExpiringSoon ? (
                        <span className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />Utløper {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</span>
                      ) : (
                        <span className="flex items-center gap-1 justify-end"><CheckCircle2 className="h-3 w-3 text-green-600" />Gyldig til {format(new Date(r.expiresAt), "d. MMM yyyy", { locale: nb })}</span>
                      )}
                    </p>
                  )}
                  {!r.expiresAt && (
                    <span className="flex items-center gap-1 justify-end text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Ingen utløpsdato
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isHrAdmin && <CourseRecordAdmin courseId={course.id} courseName={course.name} />}
    </div>
  );
}
