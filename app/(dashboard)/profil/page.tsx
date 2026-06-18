import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyProfileClient } from "@/features/profile/MyProfileClient";

export const metadata = { title: "Min profil – HR/HMS" };

export default async function MinProfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Min profil</h1>
        <p className="text-sm text-muted-foreground">Oppdater kontaktinformasjonen din.</p>
      </div>
      <MyProfileClient email={user.email ?? ""} />
    </div>
  );
}
