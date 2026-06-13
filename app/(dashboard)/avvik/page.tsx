import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { IncidentListClient } from "@/features/incidents/IncidentListClient";

export const metadata = { title: "Avvik – HR/HMS" };

export default async function AvvikPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const departments = await db.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avvik</h1>
          <p className="text-sm text-muted-foreground">
            {profile.role === "EMPLOYEE"
              ? "Dine rapporterte avvik."
              : profile.role === "MANAGER"
              ? "Avvik i din avdeling."
              : "Alle avvik i organisasjonen."}
          </p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/avvik/ny">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Rapporter avvik</span>
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Laster avvik…</div>}>
        <IncidentListClient departments={departments} viewerRole={profile.role} />
      </Suspense>
    </div>
  );
}
