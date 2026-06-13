import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { RiskAssessmentTable } from "@/features/risk/RiskAssessmentTable";

export default async function RisikoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  // EMPLOYEE sees no risk assessments in list (only actions)
  if (profile.role === "EMPLOYEE") redirect("/tiltak");

  const departments = await db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const canCreate = profile.role === "ADMIN" || profile.role === "HR" || profile.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risikovurderinger</h1>
          <p className="text-sm text-muted-foreground mt-1">HMS-risikovurderinger med risikopunkter og tiltak</p>
        </div>
        {canCreate && (
          <Button asChild className="min-h-[44px]">
            <Link href="/risiko/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny risikovurdering</span>
            </Link>
          </Button>
        )}
      </div>

      <RiskAssessmentTable viewerRole={profile.role} departments={departments} />
    </div>
  );
}
