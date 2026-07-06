import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CertificationMatrix } from "@/features/employees/CertificationMatrix";

export const metadata = { title: "Kompetansematrise – Truls HR" };

export default async function KompetanseMatrisePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/rapporter"><ArrowLeft className="h-4 w-4 mr-1" /> Rapporter</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kompetansematrise</h1>
        <p className="text-sm text-muted-foreground">
          Oversikt over sertifikater og utløpsdatoer for alle aktive ansatte.
        </p>
      </div>
      <CertificationMatrix />
    </div>
  );
}
