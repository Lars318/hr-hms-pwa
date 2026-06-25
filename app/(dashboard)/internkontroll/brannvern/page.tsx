import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FagmodulView } from "@/features/internkontroll/FagmodulView";
import { BRANNVERN } from "@/features/internkontroll/sjekklister";

export const metadata = { title: "Brannvern – Internkontroll – Truls HR" };

export default async function BrannvernPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canEdit = ["ADMIN", "HR", "MANAGER"].includes(profile.role);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/internkontroll" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{BRANNVERN.navn}</h1>
            <p className="text-sm text-muted-foreground">{BRANNVERN.beskrivelse}</p>
          </div>
        </div>
      </div>

      <FagmodulView modul={BRANNVERN} canEdit={canEdit} />
    </div>
  );
}
