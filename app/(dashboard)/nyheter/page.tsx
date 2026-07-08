import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { AnnouncementList } from "@/features/announcements/AnnouncementList";
import { AnnouncementForm } from "@/features/announcements/AnnouncementForm";

export const metadata = { title: "Nyheter – Truls HR" };

export default async function NyheterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const canCreate = profile.role === "ADMIN" || profile.role === "HR" || profile.role === "MANAGER";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nyheter</h1>
        <p className="text-sm text-muted-foreground">Kunngjøringer og beskjeder for organisasjonen.</p>
      </div>

      {canCreate && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Ny kunngjøring</h2>
          <AnnouncementForm />
        </div>
      )}

      <AnnouncementList />
    </div>
  );
}
