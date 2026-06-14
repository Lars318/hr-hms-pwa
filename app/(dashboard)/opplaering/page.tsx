import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { GraduationCap, Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "HMS-opplæring – HR/HMS" };

export default async function OpplaeringPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  const courses = await db.trainingCourse.findMany({
    where: { status: "ACTIVE" },
    include: {
      _count: { select: { records: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: [{ isRequired: "desc" }, { name: "asc" }],
  });

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Hent egne records for EMPLOYEE-visning
  const myRecords = await db.trainingRecord.findMany({
    where: { profileId: profile.id },
    select: { courseId: true, completedAt: true, expiresAt: true },
  });
  const myRecordMap = new Map(myRecords.map((r) => [r.courseId, r]));

  const categories = Array.from(new Set(courses.map((c) => c.category))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            HMS-opplæring
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Register over gjennomført og påkrevd HMS-opplæring.
          </p>
        </div>
        {isHrAdmin && (
          <Button asChild size="sm">
            <Link href="/opplaering/ny">
              <Plus className="h-4 w-4 mr-1" />
              Nytt kurs
            </Link>
          </Button>
        )}
      </div>

      {/* Snarlenker */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/opplaering/mine">Mine opplæringer</Link>
        </Button>
        {(isHrAdmin || profile.role === "MANAGER") && (
          <Button asChild variant="outline" size="sm">
            <Link href="/opplaering/admin">Administrer records</Link>
          </Button>
        )}
      </div>

      {/* Kursliste per kategori */}
      {categories.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Ingen kurs registrert ennå.</p>
          {isHrAdmin && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/opplaering/ny">Opprett første kurs</Link>
            </Button>
          )}
        </div>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{cat}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {courses.filter((c) => c.category === cat).map((course) => {
                const myRecord = myRecordMap.get(course.id);
                const isExpired = myRecord?.expiresAt ? myRecord.expiresAt < now : false;
                const isExpiringSoon = myRecord?.expiresAt
                  ? myRecord.expiresAt > now && myRecord.expiresAt < soonThreshold
                  : false;
                const isDone = !!myRecord && !isExpired;

                return (
                  <Link
                    key={course.id}
                    href={isHrAdmin || profile.role === "MANAGER" ? `/opplaering/${course.id}` : "/opplaering/mine"}
                    className="rounded-xl border p-4 hover:bg-accent transition-colors block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{course.name}</p>
                        {course.location && (
                          <p className="text-xs text-muted-foreground">{course.location.name}</p>
                        )}
                        {course.validityMonths && (
                          <p className="text-xs text-muted-foreground">
                            Gyldighet: {course.validityMonths} mnd
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {course.isRequired && (
                          <Badge variant="destructive" className="text-xs">Obligatorisk</Badge>
                        )}
                        {isExpired && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" /> Utløpt
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <Clock className="h-3 w-3" /> Utløper snart
                          </span>
                        )}
                        {isDone && !isExpiringSoon && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Fullført
                          </span>
                        )}
                        {!myRecord && (
                          <span className="text-xs text-muted-foreground">Ikke fullført</span>
                        )}
                      </div>
                    </div>
                    {isHrAdmin && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {course._count.records} registrerte
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
