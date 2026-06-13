import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmployeeListClient } from "@/features/employees/EmployeeListClient";

export const metadata = { title: "Ansatte – HR/HMS" };

export default async function AnsattePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  const departments = await db.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ansatte</h1>
          <p className="text-sm text-muted-foreground">Administrer ansattprofiler og tilganger.</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/ansatte/ny">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Ny ansatt</span>
          </Link>
        </Button>
      </div>

      <EmployeeListClient departments={departments} />
    </div>
  );
}
