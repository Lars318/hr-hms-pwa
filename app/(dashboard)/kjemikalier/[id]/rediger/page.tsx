import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FlaskConical } from "lucide-react";
import { ChemicalForm } from "@/features/chemicals/ChemicalForm";

export const metadata = { title: "Rediger kjemikalie – Stoffkartotek" };

export default async function RedigerKjemikaliePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect(`/kjemikalier/${params.id}`);

  const chemical = await db.chemical.findUnique({ where: { id: params.id } });
  if (!chemical) notFound();

  const [locations, departments] = await Promise.all([
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6" />
          Rediger kjemikalie
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{chemical.name}</p>
      </div>
      <ChemicalForm locations={locations} departments={departments} initial={chemical} />
    </div>
  );
}
