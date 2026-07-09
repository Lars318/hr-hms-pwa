import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { DocumentForm } from "@/features/documents/DocumentForm";

export default async function NyttDokumentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/dokumenter");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nytt dokument</h1>
        <p className="text-sm text-muted-foreground mt-1">Last opp et dokument til arkivet</p>
      </div>

      <DocumentForm mode="create" />
    </div>
  );
}
