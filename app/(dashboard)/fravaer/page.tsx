import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, CalendarRange } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LeaveListClient } from "@/features/leave/LeaveListClient";
import { LeaveBalanceCards } from "@/features/leave/LeaveBalanceCards";

export const metadata = { title: "Fravær – HR/HMS" };

export default async function FravaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const description =
    profile.role === "EMPLOYEE"
      ? "Dine fraværssøknader."
      : profile.role === "MANAGER"
      ? "Fraværssøknader i din avdeling."
      : "Alle fraværssøknader i organisasjonen.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fravær</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="min-h-[44px]">
            <Link href="/fravaer/kalender">
              <CalendarRange className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Kalender</span>
            </Link>
          </Button>
          <Button asChild className="min-h-[44px]">
            <Link href="/fravaer/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny søknad</span>
            </Link>
          </Button>
        </div>
      </div>

      <LeaveBalanceCards />

      <LeaveListClient viewerRole={profile.role} />
    </div>
  );
}
