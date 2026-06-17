import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { DepartmentAdmin } from "@/features/departments/DepartmentAdmin";

export const metadata = { title: "Avdelinger – HR/HMS" };

export default async function AvdelingerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  const locations = await db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avdelinger</h1>
        <p className="text-sm text-muted-foreground">
          Administrer avdelinger og se antall ansatte per avdeling.
          {profile.role !== "ADMIN" && (
            <span className="ml-1">(Kun administratorer kan slette avdelinger.)</span>
          )}
        </p>
      </div>

      <DepartmentAdmin locations={locations} />
    </div>
  );
}
