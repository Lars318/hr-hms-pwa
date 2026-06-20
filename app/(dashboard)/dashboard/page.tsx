import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { PersonalizedDashboard } from "@/features/dashboard/PersonalizedDashboard";
import { DashboardGreeting } from "@/features/dashboard/DashboardGreeting";
import { TodoPopup } from "@/features/dashboard/TodoPopup";

export const metadata = { title: "Dashboard – HR/HMS" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHms =
    profile.role === "HR" &&
    (profile.title?.toLowerCase().includes("hms") ?? false);

  return (
    <div>
      <TodoPopup role={profile.role} />
      <DashboardGreeting name={profile.fullName} role={profile.role} />
      <div className="mt-6">
      <PersonalizedDashboard
        viewerRole={profile.role}
        viewerName={profile.fullName}
        isHms={isHms}
      />
      </div>
    </div>
  );
}
