import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { CompetencyMatrix } from "@/features/training/CompetencyMatrix";

export const metadata = { title: "Kompetansematrise – HR/HMS" };

export default async function CompetencyMatrixPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR" || profile.role === "MANAGER";
  if (!isHrAdmin) redirect("/opplaering");

  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kompetansematrise</h1>
        <p className="text-sm text-muted-foreground">Oversikt over hvem som har fullført hvilke kurs</p>
      </div>
      <CompetencyMatrix departments={departments} />
    </div>
  );
}
