import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DirectoryClient } from "@/features/employees/DirectoryClient";

export const metadata = { title: "Kollegaer – HR/HMS" };

export default async function KollegaerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kollegaer</h1>
        <p className="text-sm text-muted-foreground">Se hvem du jobber med.</p>
      </div>
      <DirectoryClient />
    </div>
  );
}
