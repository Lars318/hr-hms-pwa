import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { HmsRundeList } from "@/features/hms-runde/HmsRundeList";

export const metadata = { title: "HMS-runde – Truls HR" };

export default async function HmsRundePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/login");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HMS-runde</h1>
            <p className="text-sm text-muted-foreground">Sjekklister og vernerunder</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isHrAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/hms-runde/maler">Maler</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/hms-runde/ny">
              <Plus className="h-4 w-4 mr-1" /> Start runde
            </Link>
          </Button>
        </div>
      </div>

      <HmsRundeList profileId={profile.id} isHrAdmin={isHrAdmin} />
    </div>
  );
}
