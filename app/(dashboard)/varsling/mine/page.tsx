import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WbStatusBadge, WbSeverityBadge, WbCategoryLabel } from "@/features/whistleblowing/WbBadges";

export const metadata = { title: "Mine varslingssaker – HR/HMS" };

export default async function MineVarslingerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const cases = await db.whistleblowingCase.findMany({
    where: { reporterId: profile.id, isAnonymous: false },
    include: {
      location: { select: { name: true } },
      assignedTo: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mine varslingssaker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dine innsendte varslingssaker. Anonyme saker vises ikke her.
          </p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/varsling/ny">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nytt varsel</span>
          </Link>
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-xl border bg-muted/20 px-6 py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Du har ikke sendt noen varslingssaker ennå.</p>
          <Button asChild variant="outline">
            <Link href="/varsling/ny">Send ditt første varsel</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/varsling/${c.id}`}
              className="block rounded-2xl border bg-card hover:bg-accent/40 transition-colors"
            >
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.caseNumber}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <WbStatusBadge status={c.status} />
                  <WbSeverityBadge severity={c.severity} />
                  <span className="text-xs text-muted-foreground">
                    <WbCategoryLabel category={c.category} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.location?.name ?? "Ingen lokasjon"}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString("nb-NO")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
