import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { IncidentForm } from "@/features/incidents/IncidentForm";

export const metadata = { title: "Rapporter avvik – HR/HMS" };

export default async function NyttAvvikPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const [departments, profiles] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    // For tildeling – kun aktive profiler
    db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/avvik">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapporter avvik</h1>
          <p className="text-sm text-muted-foreground">Fyll ut alle obligatoriske felter.</p>
        </div>
      </div>

      <IncidentForm
        mode="create"
        departments={departments}
        profiles={profiles}
        viewerRole={profile.role}
        viewerDepartmentId={profile.departmentId}
      />
    </div>
  );
}
