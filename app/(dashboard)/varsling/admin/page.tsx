import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ArrowRight, Lock } from "lucide-react";
import { WbStatusBadge, WbSeverityBadge, WbCategoryLabel } from "@/features/whistleblowing/WbBadges";
import { WbAdminFilter } from "@/features/whistleblowing/WbAdminFilter";
import type { WhistleblowingStatus, WhistleblowingCategory, WhistleblowingSeverity } from "@prisma/client";

export const metadata = { title: "Varslingssaker – Admin – HR/HMS" };

interface Props {
  searchParams: {
    status?: string;
    category?: string;
    severity?: string;
    locationId?: string;
  };
}

export default async function VarslingAdminPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHmsRole = profile.role === "ADMIN" || profile.role === "HR";
  const isManagerAssigned = profile.role === "MANAGER";

  if (!isHmsRole && !isManagerAssigned) redirect("/ingen-tilgang");

  const locations = await db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  // Bygg filter
  const whereBase: Record<string, unknown> = {};
  if (profile.role === "MANAGER") whereBase.assignedToId = profile.id;
  if (searchParams.status) whereBase.status = searchParams.status as WhistleblowingStatus;
  if (searchParams.category) whereBase.category = searchParams.category as WhistleblowingCategory;
  if (searchParams.severity) whereBase.severity = searchParams.severity as WhistleblowingSeverity;
  if (searchParams.locationId) whereBase.locationId = searchParams.locationId;
  const where = whereBase as any;

  const cases = await db.whistleblowingCase.findMany({
    where,
    include: {
      reporter: { select: { fullName: true } },
      assignedTo: { select: { fullName: true } },
      location: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });

  const openCount = cases.filter((c) => !["CLOSED", "REJECTED"].includes(c.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Varslingssaker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile.role === "MANAGER"
            ? "Saker du er tildelt som saksbehandler."
            : "Alle varslingssaker – konfidensiell behandling."}
        </p>
      </div>

      {/* Konfidensialitets-banner */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Varslingssaker skal behandles konfidensielt. Del ikke innholdet utover de som er direkte
          involvert i saksbehandlingen. Gjengjeldelse er forbudt (Aml §2A-2).
        </p>
      </div>

      {/* Statistikk */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Totalt</p>
          <p className="text-2xl font-bold tracking-tight">{cases.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Åpne</p>
          <p className="text-2xl font-bold text-orange-600">{openCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Lukket</p>
          <p className="text-2xl font-bold text-green-600">{cases.length - openCount}</p>
        </div>
      </div>

      {/* Filter */}
      <WbAdminFilter />

      {/* Liste */}
      {cases.length === 0 ? (
        <div className="rounded-xl border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Ingen varslingssaker funnet.</p>
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
                  {c.isAnonymous && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Anonym</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-1">
                  <span>
                    {c.isAnonymous ? "Anonym" : (c.reporter?.fullName ?? "Ukjent")} ·{" "}
                    {c.location?.name ?? "Ingen lokasjon"}
                  </span>
                  <span>
                    Saksbehandler: {c.assignedTo?.fullName ?? "Ikke tildelt"} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString("nb-NO")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
