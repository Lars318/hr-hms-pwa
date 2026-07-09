import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FlaskConical, Plus, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export const metadata = { title: "Stoffkartotek – HR/HMS" };

export default async function KjemikalierPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  // Finn primærlokasjon for EMPLOYEE/MANAGER-filtrering
  const primaryAssignment = profile.role !== "ADMIN" && profile.role !== "HR"
    ? await db.profileAssignment.findFirst({
        where: { profileId: profile.id, isPrimary: true },
        select: { locationId: true },
      })
    : null;

  const chemicals = await db.chemical.findMany({
    where: {
      status: "ACTIVE",
      ...(primaryAssignment ? { locationId: primaryAssignment.locationId } : {}),
    },
    include: {
      location: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const enriched = chemicals.map((c) => {
    const reviewOverdue = c.reviewDate ? c.reviewDate < now : false;
    const reviewSoon = c.reviewDate ? c.reviewDate > now && c.reviewDate < soonThreshold : false;
    const expiresOverdue = c.expiresAt ? c.expiresAt < now : false;
    const expiresSoon = c.expiresAt ? c.expiresAt > now && c.expiresAt < soonThreshold : false;
    const needsAttention = reviewOverdue || reviewSoon || expiresOverdue || expiresSoon;
    return { ...c, reviewOverdue, reviewSoon, expiresOverdue, expiresSoon, needsAttention };
  });

  const attentionCount = enriched.filter((c) => c.needsAttention).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Stoffkartotek
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Register over kjemikalier og sikkerhetsdatablader (SDS).
          </p>
        </div>
        {isHrAdmin && (
          <Button asChild size="sm">
            <Link href="/kjemikalier/ny">
              <Plus className="h-4 w-4 mr-1" />
              Nytt kjemikalie
            </Link>
          </Button>
        )}
      </div>

      {attentionCount > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            {attentionCount} kjemikalie{attentionCount > 1 ? "r" : ""} krever oppfølging (revisjon/utløp)
          </p>
        </div>
      )}

      {chemicals.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Ingen kjemikalier registrert ennå.</p>
          {isHrAdmin && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/kjemikalier/ny">Legg til første kjemikalie</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden">
          {enriched.map((c) => (
            <Link
              key={c.id}
              href={`/kjemikalier/${c.id}`}
              className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-accent transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.hazardSymbols.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.hazardSymbols.slice(0, 3).map((h) => (
                        <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                      ))}
                      {c.hazardSymbols.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{c.hazardSymbols.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.supplier && `${c.supplier} · `}
                  {c.location?.name ?? "Alle lokasjoner"}
                  {c.department && ` · ${c.department.name}`}
                </p>
              </div>
              <div className="shrink-0 text-right space-y-0.5">
                {(c.reviewOverdue || c.expiresOverdue) && (
                  <p className="text-xs text-red-600 flex items-center gap-1 justify-end">
                    <AlertTriangle className="h-3 w-3" />
                    {c.expiresOverdue ? "Utløpt" : "Revisjon forfalt"}
                  </p>
                )}
                {(c.reviewSoon || c.expiresSoon) && !(c.reviewOverdue || c.expiresOverdue) && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {c.expiresSoon
                      ? `Utløper ${format(new Date(c.expiresAt!), "d. MMM", { locale: nb })}`
                      : `Revisjon ${format(new Date(c.reviewDate!), "d. MMM", { locale: nb })}`}
                  </p>
                )}
                {!c.needsAttention && (
                  <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="h-3 w-3" />OK
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
