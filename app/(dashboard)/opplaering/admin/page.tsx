import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrainingAdminClient } from "@/features/training/TrainingAdminClient";

export const metadata = { title: "Opplæringsadmin – HR/HMS" };

export default async function TrainingAdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";
  if (!isHrAdmin && !isManager) redirect("/opplaering");

  const [courses, locations, profiles] = await Promise.all([
    db.trainingCourse.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    isHrAdmin
      ? db.profile.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true, email: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([] as { id: string; fullName: string; email: string }[]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/opplaering"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Opplæringsadmin
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Administrer gjennomføringer, følg opp manglende og utløpende opplæring.
          </p>
        </div>
        {isHrAdmin && (
          <Button asChild size="sm" variant="outline">
            <Link href="/opplaering/ny">Nytt kurs</Link>
          </Button>
        )}
      </div>

      <TrainingAdminClient
        courses={courses}
        locations={locations}
        profiles={profiles}
      />
    </div>
  );
}
