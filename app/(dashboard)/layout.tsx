import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnlineStatusBanner } from "@/features/pwa/OnlineStatusBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });

  const role = profile?.role ?? "EMPLOYEE";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — kun synlig fra lg */}
      <Sidebar role={role} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <OnlineStatusBanner />
        <TopBar email={user.email ?? ""} profileId={profile?.id} />
        {/* pb-20 på mobil gir plass til BottomNav */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* BottomNav — kun synlig under lg */}
      <BottomNav role={role} />
    </div>
  );
}
