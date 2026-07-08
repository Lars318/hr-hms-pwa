import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { TodoPopup } from "@/features/dashboard/TodoPopup";
import { HomeDashboard } from "@/features/dashboard/home/HomeDashboard";

export const metadata = { title: "Dashboard – HR/HMS" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  return (
    <div>
      <TodoPopup role={profile.role} />
      <HomeDashboard
        role={profile.role}
        profileId={profile.id}
        fullName={profile.fullName}
        avatarUrl={profile.avatarUrl}
        isContractor={profile.employmentType === "SELF_EMPLOYED"}
      />
    </div>
  );
}
