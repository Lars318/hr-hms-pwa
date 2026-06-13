import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { HandbookNav } from "@/features/handbook/HandbookNav";
import { HandbookReadBanner } from "@/features/handbook/HandbookReadBanner";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Props {
  params: { id: string };
}

export default async function HandbookCategoryPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const [category, categories] = await Promise.all([
    db.handbookCategory.findUnique({
      where: { id: params.id },
      include: { sections: { orderBy: { order: "asc" } } },
    }),
    db.handbookCategory.findMany({
      orderBy: { order: "asc" },
      include: { sections: { select: { id: true } } },
    }),
  ]);

  if (!category) notFound();

  const latestVersion = await db.handbookVersion.findFirst({
    orderBy: { version: "desc" },
  });

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/personalhandbok" className="text-sm text-muted-foreground hover:underline">
            ← Personalhåndbok
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{category.title}</h1>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
        {isHrAdmin && (
          <Link
            href={`/personalhandbok/admin/${category.id}/rediger`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" /> Rediger
          </Link>
        )}
      </div>

      {latestVersion && <HandbookReadBanner />}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <div className="hidden lg:block">
          <HandbookNav categories={categories} />
        </div>

        {/* Innhold */}
        <div className="space-y-6">
          {category.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen seksjoner i dette kapittelet ennå.
              {isHrAdmin && (
                <>
                  {" "}
                  <Link href={`/personalhandbok/admin/${category.id}/rediger`} className="underline">
                    Legg til seksjoner her.
                  </Link>
                </>
              )}
            </p>
          ) : (
            category.sections.map((section) => (
              <article key={section.id} className="space-y-3">
                <h2 className="text-lg font-semibold border-b pb-2">{section.title}</h2>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {section.content}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sist oppdatert {format(new Date(section.updatedAt), "d. MMM yyyy", { locale: nb })}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
