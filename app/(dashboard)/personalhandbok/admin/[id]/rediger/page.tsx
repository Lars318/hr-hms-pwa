import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { HandbookCategoryForm } from "@/features/handbook/HandbookCategoryForm";
import { HandbookSectionManager } from "@/features/handbook/HandbookSectionForm";

interface Props {
  params: { id: string };
}

export const metadata = { title: "Rediger kapittel – Personalhåndbok" };

export default async function RedigerKapittelPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  const category = await db.handbookCategory.findUnique({
    where: { id: params.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!category) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/personalhandbok/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:underline mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Administrer personalhåndbok
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Rediger: {category.title}</h1>
      </div>

      {/* Kapittelmeta */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Kapittelmeta</h2>
        <HandbookCategoryForm mode="edit" category={category} />
      </section>

      {/* Seksjoner */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Seksjoner</h2>
          <p className="text-sm text-muted-foreground">
            Legg til, rediger eller slett seksjoner i dette kapittelet.
          </p>
        </div>
        <HandbookSectionManager
          categoryId={category.id}
          sections={category.sections}
        />
      </section>
    </div>
  );
}
