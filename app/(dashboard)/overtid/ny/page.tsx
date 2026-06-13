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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/overtid">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ny registrering</h1>
          <p className="text-sm text-muted-foreground">Registrer overtid eller avspasering</p>
        </div>
      </div>
      <OvertimeForm mode="create" />
    </div>
  );
}
