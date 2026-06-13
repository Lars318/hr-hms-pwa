import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
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
      <OvertimeList role={profile.role} />
    </div>
  );
}
