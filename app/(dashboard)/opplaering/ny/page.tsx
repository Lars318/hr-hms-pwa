import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { GraduationCap } from "lucide-react";
import { NewCourseForm } from "@/features/training/NewCourseForm";

export const metadata = { title: "Nytt kurs – HMS-opplæring" };

export default async function NyttKursPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/opplaering");

  const locations = await db.location.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Nytt opplæringskurs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Opprett et nytt kurs i HMS-opplæringsregisteret.
        </p>
      </div>

      <NewCourseForm locations={locations} />
    </div>
  );
}
