import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { OvertimeApprovalList } from "@/features/overtime/OvertimeApprovalList";

export const metadata = { title: "Godkjenning – Overtid og avspasering – HR/HMS" };

export default async function OvertidGodkjenningPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canApprove = ["ADMIN", "HR", "MANAGER"].includes(profile.role);
  if (!canApprove) redirect("/overtid");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Godkjenning av overtid</h1>
        <p className="text-sm text-muted-foreground">Innsendte registreringer som venter på godkjenning</p>
      </div>
      <OvertimeApprovalList role={profile.role} departmentId={profile.departmentId} />
    </div>
  );
}
