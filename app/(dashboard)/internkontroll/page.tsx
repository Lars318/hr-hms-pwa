import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InternkontrollDashboard } from "@/features/internkontroll/InternkontrollDashboard";

export const metadata = { title: "Internkontroll – Truls HR" };

export default async function InternkontrollPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canEdit = ["ADMIN", "HR", "MANAGER"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Internkontroll</h1>
          <p className="text-sm text-muted-foreground">Lovpålagte HMS-kontroller og dokumentasjon</p>
        </div>
        {canEdit && (
          <Button asChild className="min-h-[44px]">
            <Link href="/internkontroll/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nytt område</span>
            </Link>
          </Button>
        )}
      </div>

      <InternkontrollDashboard />
    </div>
  );
}
