import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { OvertimeForm } from "@/features/overtime/OvertimeForm";

export const metadata = { title: "Ny overtidsregistrering – HR/HMS" };

export default async function NyOvertidPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.employmentType === "SELF_EMPLOYED") redirect("/ingen-tilgang");

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/overtid"><ArrowLeft className="h-4 w-4 mr-1" /> Tilbake</Link>
        </Button>
        <div className="text-center mt-3">
          <h1 className="text-2xl font-bold tracking-tight">Ny registrering</h1>
          <p className="text-sm text-muted-foreground mt-1">Registrer overtid eller avspasering</p>
        </div>
      </div>
      <OvertimeForm mode="create" />
    </div>
  );
}
