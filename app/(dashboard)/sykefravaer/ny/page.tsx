import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { NewSickCaseForm } from "@/features/sickLeave/NewSickCaseForm";

export const metadata = { title: "Ny sykefraværssak – Pulsfollo" };

export default async function NySykefravaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || !["ADMIN", "HR", "MANAGER"].includes(profile.role)) {
    redirect("/ingen-tilgang");
  }

  const employees = await db.profile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/sykefravaer">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
        </Link>
      </Button>
      <div>
        <h1 className="text-xl font-bold">Registrer sykefraværssak</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Milepæler (oppfølgingsplan uke 4, dialogmøte uke 7 og 26) opprettes automatisk.
        </p>
      </div>
      <NewSickCaseForm employees={employees} />
    </div>
  );
}
