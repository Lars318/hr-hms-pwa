import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ActionTable } from "@/features/actions/ActionTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function TiltakPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const [departments, employees] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.profile.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiltak"
        description="Oversikt over alle tiltak fra risikovurderinger"
      />

      <ActionTable viewerRole={profile.role} departments={departments} employees={employees} />
    </div>
  );
}
