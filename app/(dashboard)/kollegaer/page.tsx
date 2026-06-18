import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { DirectoryClient } from "@/features/employees/DirectoryClient";

export const metadata = { title: "Kollegaer – HR/HMS" };

export default async function KollegaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locations = await db.location.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kollegaer</h1>
        <p className="text-sm text-muted-foreground">Finn og kontakt dine kollegaer.</p>
      </div>
      <DirectoryClient locations={locations} />
    </div>
  );
}
