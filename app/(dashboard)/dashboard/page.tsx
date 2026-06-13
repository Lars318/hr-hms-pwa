import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { DashboardClient } from "@/features/dashboard/DashboardClient";

export const metadata = { title: "Dashboard – HR/HMS" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  // HMS-deteksjon: HR-rolle med HMS i tittelen får HMS-fokusert dashboard
  const isHms =
    profile.role === "HR" &&
    (profile.title?.toLowerCase().includes("hms") ?? false);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {getGreeting()} · {profile.email}
      </p>
      <DashboardClient
        viewerRole={profile.role}
        viewerName={profile.fullName}
        isHms={isHms}
      />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 10) return "God morgen";
  if (h < 12) return "Hei";
  if (h < 17) return "God ettermiddag";
  return "God kveld";
}
