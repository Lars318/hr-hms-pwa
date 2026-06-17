import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { LocationCreateForm } from "@/features/locations/LocationCreateForm";

export const metadata = { title: "Ny lokasjon – HR/HMS" };

export default async function NyLokasjonPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  if (!isHrAdmin) redirect("/lokasjoner");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ny lokasjon</h1>
        <p className="text-sm text-muted-foreground">Legg til en ny lokasjon i organisasjonen.</p>
      </div>
      <LocationCreateForm />
    </div>
  );
}
