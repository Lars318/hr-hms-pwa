import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { OvertimeList } from "@/features/overtime/OvertimeList";

export const metadata = { title: "Overtid og avspasering – HR/HMS" };

export default async function OvertidPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overtid og avspasering</h1>
          <p className="text-sm text-muted-foreground">Dine registreringer og timebanksaldo</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/overtid/ny">
            <Plus className="h-4 w-4 mr-2" />
            Ny registrering
          </Link>
        </Button>
      </div>
      {/* Avgrensningsinfo */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Denne modulen registrerer overtid og avspasering (timebank). Full daglig
          arbeidstidsregistrering håndteres i separate systemer.
        </p>
      </div>
      <OvertimeList role={profile.role} />
    </div>
  );
}
