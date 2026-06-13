import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { HandbookAdminTable } from "@/features/handbook/HandbookAdminTable";
import { HandbookPublishButton } from "@/features/handbook/HandbookPublishButton";
import { HandbookReadStatus } from "@/features/handbook/HandbookReadStatus";

export const metadata = { title: "Administrer personalhåndbok – HR/HMS" };

export default async function PersonalhandbokAdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/personalhandbok"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:underline mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Personalhåndbok
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Administrer personalhåndbok</h1>
          <p className="text-sm text-muted-foreground">Kapitler, seksjoner og publisering</p>
        </div>
        <Button asChild className="min-h-[44px] gap-2">
          <Link href="/personalhandbok/admin/ny">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Nytt kapittel</span>
          </Link>
        </Button>
      </div>

      {/* Kapitteloversikt */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Kapitler</h2>
        <HandbookAdminTable />
      </section>

      {/* Publisering */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Publiser ny versjon</h2>
          <p className="text-sm text-muted-foreground">
            Alle aktive ansatte varsles via in-app, e-post og push.
          </p>
        </div>
        <HandbookPublishButton />
      </section>

      {/* Lesestatus */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Lesestatus</h2>
          <p className="text-sm text-muted-foreground">
            Hvem har bekreftet at de har lest siste versjon.
          </p>
        </div>
        <HandbookReadStatus />
      </section>
    </div>
  );
}
