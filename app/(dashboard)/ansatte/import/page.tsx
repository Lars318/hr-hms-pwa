import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ImportAnsatteWizard } from "@/features/admin/ImportAnsatteWizard";

export const metadata = { title: "Importer ansatte – Truls HR" };

export default async function ImportAnsattePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (!["ADMIN", "HR"].includes(profile.role)) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/ansatte" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Importer ansatte</h1>
            <p className="text-sm text-muted-foreground">Engangsimport fra CSV — f.eks. eksport fra Tripletex</p>
          </div>
        </div>
      </div>

      <ImportAnsatteWizard />
    </div>
  );
}
