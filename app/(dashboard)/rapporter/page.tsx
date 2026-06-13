import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { RapporterClient } from "@/features/reports/RapporterClient";

export const metadata = { title: "Rapporter – HR/HMS" };

export default async function RapporterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role === "EMPLOYEE") redirect("/ingen-tilgang");

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
        <p className="text-sm text-muted-foreground">
          {profile.role === "MANAGER"
            ? "Rapporter for din avdeling."
            : "Rapporter og CSV-eksport for hele organisasjonen."}
        </p>
      </div>

      <RapporterClient viewerRole={profile.role} departments={departments} />
    </div>
  );
}
