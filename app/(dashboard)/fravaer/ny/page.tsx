import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LeaveRequestForm } from "@/features/leave/LeaveRequestForm";

export const metadata = { title: "Ny fraværssøknad – HR/HMS" };

export default async function NyFravaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fravaer">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ny fraværssøknad</h1>
          <p className="text-sm text-muted-foreground">Fyll ut skjemaet og send søknaden til godkjenning.</p>
        </div>
      </div>

      <LeaveRequestForm mode="create" />
    </div>
  );
}
