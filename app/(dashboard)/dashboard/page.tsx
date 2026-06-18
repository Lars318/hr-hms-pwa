import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { PersonalizedDashboard } from "@/features/dashboard/PersonalizedDashboard";
import { DashboardGreeting } from "@/features/dashboard/DashboardGreeting";

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
    <div className="space-y-2">
      <DashboardGreeting name={profile.fullName} email={profile.email} />
      <PersonalizedDashboard
        viewerRole={profile.role}
        viewerName={profile.fullName}
        isHms={isHms}
      />
    </div>
  );
}
