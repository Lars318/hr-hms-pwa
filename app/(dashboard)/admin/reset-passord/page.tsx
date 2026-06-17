import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ResetPasswordForm } from "@/features/admin/ResetPasswordForm";

export const metadata = { title: "Tilbakestill passord – HR/HMS" };

export default async function ResetPassordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || profile.role !== "ADMIN") redirect("/ingen-tilgang");

  const profiles = await db.profile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, fullName: true, email: true, supabaseUserId: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tilbakestill passord</h1>
        <p className="text-sm text-muted-foreground">Sett nytt passord for en ansatt.</p>
      </div>
      <ResetPasswordForm profiles={profiles} />
    </div>
  );
}
