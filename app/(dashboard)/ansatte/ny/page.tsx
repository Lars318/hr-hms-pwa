import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/features/employees/EmployeeForm";

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
            Opprett profil for en bruker som allerede er opprettet i Supabase Auth.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Viktig</p>
        <p>Brukeren må først opprettes i Supabase Auth (Authentication → Users).</p>
        <p>Kopier brukerens UUID og e-post herfra og lim inn nedenfor.</p>
      </div>

      <EmployeeForm departments={departments} mode="create" />
    </div>
  );
}
