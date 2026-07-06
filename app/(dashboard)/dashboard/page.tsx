import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { PersonalizedDashboard } from "@/features/dashboard/PersonalizedDashboard";
import { DashboardGreeting } from "@/features/dashboard/DashboardGreeting";
import { TodoPopup } from "@/features/dashboard/TodoPopup";
import { EmployeeHome } from "@/features/dashboard/employee/EmployeeHome";

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

  // Rolige ansatt-startsiden (kun EMPLOYEE, ikke selvstendig) på mobil.
  const isEmployeeHome =
    profile.role === "EMPLOYEE" && profile.employmentType !== "SELF_EMPLOYED";

  return (
    <div>
      <TodoPopup role={profile.role} />

      {isEmployeeHome && (
        <div className="lg:hidden">
          <EmployeeHome
            profileId={profile.id}
            fullName={profile.fullName}
            avatarUrl={profile.avatarUrl}
          />
        </div>
      )}

      <div className={isEmployeeHome ? "hidden lg:block" : ""}>
        <DashboardGreeting name={profile.fullName} role={profile.role} />
        <div className="mt-6">
        <PersonalizedDashboard
          viewerRole={profile.role}
          viewerName={profile.fullName}
          isHms={isHms}
          isContractor={profile.employmentType === "SELF_EMPLOYED"}
        />
        </div>
      </div>
    </div>
  );
}
