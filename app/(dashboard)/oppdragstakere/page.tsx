import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ContractorOverview } from "@/features/employees/ContractorOverview";

export const metadata = { title: "Selvstendig næringsdrivende – Truls HR" };

export default async function OppdragstakerePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (!["ADMIN", "HR"].includes(profile.role)) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selvstendig næringsdrivende</h1>
          <p className="text-sm text-muted-foreground">
            Oppdragsavtale, egenerklæring og HMS-bekreftelser
          </p>
        </div>
      </div>

      <ContractorOverview />
    </div>
  );
}
