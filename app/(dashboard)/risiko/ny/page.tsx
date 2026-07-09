import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { RiskAssessmentForm } from "@/features/risk/RiskAssessmentForm";

export default async function NyRisikovurderingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canCreate = profile.role === "ADMIN" || profile.role === "HR" || profile.role === "MANAGER";
  if (!canCreate) redirect("/risiko");

  const departments = await db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ny risikovurdering</h1>
        <p className="text-sm text-muted-foreground mt-1">Opprett en ny HMS-risikovurdering</p>
      </div>
      <RiskAssessmentForm mode="create" departments={departments} />
    </div>
  );
}
