import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { HandbookNav } from "@/features/handbook/HandbookNav";
import { HandbookReadBanner } from "@/features/handbook/HandbookReadBanner";
import { BookOpen } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export const metadata = { title: "Personalhåndbok – HR/HMS" };

export default async function PersonalhandbokPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const categories = await db.handbookCategory.findMany({
    orderBy: { order: "asc" },
    include: { sections: { select: { id: true }, orderBy: { order: "asc" } } },
  });

  const latestVersion = await db.handbookVersion.findFirst({
    orderBy: { version: "desc" },
    include: { publishedBy: { select: { fullName: true } } },
  });

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personalhåndbok</h1>
          {latestVersion ? (
            <p className="text-sm text-muted-foreground">
              Versjon {latestVersion.version} · oppdatert{" "}
              {format(new Date(latestVersion.publishedAt), "d. MMMM yyyy", { locale: nb })}
              {latestVersion.publishNote && ` — ${latestVersion.publishNote}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Ingen versjon publisert ennå.</p>
          )}
        </div>
        {isHrAdmin && (
          <Link
            href="/personalhandbok/admin"
            className="text-sm text-muted-foreground hover:underline"
          >
            Administrer →
          </Link>
        )}
      </div>

      {/* Lesebanner — klientside */}
      {latestVersion && <HandbookReadBanner />}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Venstre: kapittelnavigasjon */}
        <div className="hidden lg:block">
          <HandbookNav categories={categories} />
        </div>

        {/* Høyre: oversikt over kapitler */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">Håndboken er ikke bygget opp ennå.</p>
                {isHrAdmin && (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/personalhandbok/admin/ny" className="underline">
                      Opprett det første kapittelet
                    </Link>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Mobilnavigasjon */}
              <div className="lg:hidden">
                <HandbookNav categories={categories} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/personalhandbok/${cat.id}`}
                    className="group rounded-2xl border bg-card p-5 hover:bg-accent/50 active:bg-accent transition-colors"
                  >
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {cat.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {cat.sections.length} seksjon{cat.sections.length !== 1 ? "er" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
