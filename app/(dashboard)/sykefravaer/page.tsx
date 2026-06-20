import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { SickLeaveList } from "@/features/sickLeave/SickLeaveList";

export const metadata = { title: "Sykefraværsoppfølging – Truls HR" };

export default async function SykefravaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canManage = ["ADMIN", "HR", "MANAGER"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sykefraværsoppfølging</h1>
          <p className="text-sm text-muted-foreground">
            Oppfølging etter AML §4-6 – dialogmøter og oppfølgingsplan
          </p>
        </div>
        {canManage && (
          <Button asChild className="min-h-[44px]">
            <Link href="/sykefravaer/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny sak</span>
            </Link>
          </Button>
        )}
      </div>

      <SickLeaveList viewerRole={profile.role} />
    </div>
  );
}
