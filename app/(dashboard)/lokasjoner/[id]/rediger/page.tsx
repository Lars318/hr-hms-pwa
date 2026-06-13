import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { LocationEditForm } from "@/features/locations/LocationEditForm";

export const metadata = { title: "Rediger lokasjon – HR/HMS" };

export default async function RedigerLokasjonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  if (!isHrAdmin) redirect("/lokasjoner");

  const [location, allProfiles] = await Promise.all([
    db.location.findUnique({
      where: { id: params.id },
      include: {
        safetyRepresentative: { select: { id: true, fullName: true } },
        hseManager: { select: { id: true, fullName: true } },
      },
    }),
    db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, title: true, role: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (!location) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rediger lokasjon</h1>
        <p className="text-sm text-muted-foreground">{location.name}</p>
      </div>
      <LocationEditForm location={location} profiles={allProfiles} />
    </div>
  );
}
