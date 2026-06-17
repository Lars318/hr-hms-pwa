import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmployeeCreateForm } from "@/features/employees/EmployeeCreateForm";

export const metadata = { title: "Ny ansatt – HR/HMS" };

export default async function NyAnsattPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "HR")) redirect("/ingen-tilgang");

  const departments = await db.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ansatte">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ny ansatt</h1>
          <p className="text-sm text-muted-foreground">
            Opprett bruker og profil i ett steg.
          </p>
        </div>
      </div>

      <EmployeeCreateForm departments={departments} />
    </div>
  );
}
