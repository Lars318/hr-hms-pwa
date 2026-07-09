import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FlaskConical, ArrowLeft, AlertTriangle, Clock, CheckCircle2, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChemicalArchiveButton } from "@/features/chemicals/ChemicalArchiveButton";

export const metadata = { title: "Kjemikalie – Stoffkartotek" };

export default async function ChemicalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const chemical = await db.chemical.findUnique({
    where: { id: params.id },
    include: {
      location: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      createdBy: { select: { id: true, fullName: true } },
      auditLogs: {
        include: { actor: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!chemical) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const reviewOverdue = chemical.reviewDate ? chemical.reviewDate < now : false;
  const reviewSoon = chemical.reviewDate ? chemical.reviewDate > now && chemical.reviewDate < soonThreshold : false;
  const expiresOverdue = chemical.expiresAt ? chemical.expiresAt < now : false;
  const expiresSoon = chemical.expiresAt ? chemical.expiresAt > now && chemical.expiresAt < soonThreshold : false;

  const ACTION_LABELS: Record<string, string> = {
    CREATED: "Opprettet",
    UPDATED: "Oppdatert",
    ARCHIVED: "Arkivert",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/kjemikalier"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            {chemical.status === "ARCHIVED" && <Badge variant="secondary">Arkivert</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{chemical.name}</h1>
          {chemical.supplier && (
            <p className="text-muted-foreground text-sm mt-0.5">Leverandør: {chemical.supplier}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {chemical.location && <span className="text-xs text-muted-foreground">{chemical.location.name}</span>}
            {chemical.department && <span className="text-xs text-muted-foreground">· {chemical.department.name}</span>}
          </div>
        </div>
        {isHrAdmin && chemical.status === "ACTIVE" && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/kjemikalier/${chemical.id}/rediger`}>
                <Edit className="h-4 w-4 mr-1" />Rediger
              </Link>
            </Button>
            <ChemicalArchiveButton id={chemical.id} />
          </div>
        )}
      </div>

      {/* Status-varsler */}
      {(reviewOverdue || expiresOverdue) && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {expiresOverdue ? "Kjemikaliet er utløpt" : "Revisjonsdato er forfalt"}
          </p>
        </div>
      )}
      {(reviewSoon || expiresSoon) && !(reviewOverdue || expiresOverdue) && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {expiresSoon ? "Utløper snart" : "Revisjon nærmer seg"}
          </p>
        </div>
      )}

      {/* Faremerking */}
      {chemical.hazardSymbols.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Faremerking</h2>
          <div className="flex flex-wrap gap-2">
            {chemical.hazardSymbols.map((h) => (
              <Badge key={h} variant="destructive" className="text-xs">{h}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* HMS-informasjon */}
      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="text-sm font-semibold">HMS-informasjon</h2>
        {chemical.protectiveEquipment && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Verneutstyr</p>
            <p className="text-sm">{chemical.protectiveEquipment}</p>
          </div>
        )}
        {chemical.riskNote && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Risikovurdering</p>
            <p className="text-sm">{chemical.riskNote}</p>
          </div>
        )}
        {chemical.storageInstructions && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Oppbevaring</p>
            <p className="text-sm">{chemical.storageInstructions}</p>
          </div>
        )}
        {chemical.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Beskrivelse</p>
            <p className="text-sm">{chemical.description}</p>
          </div>
        )}
      </section>

      {/* SDS og datoer */}
      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Sikkerhetsdatablad og datoer</h2>
        {chemical.sdsReference && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">SDS-referanse</p>
            {chemical.sdsReference.startsWith("http") ? (
              <a href={chemical.sdsReference} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline">
                Åpne sikkerhetsdatablad <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm">{chemical.sdsReference}</p>
            )}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Revisjonsdato</p>
            <p className={`text-sm flex items-center gap-1 ${reviewOverdue ? "text-red-600" : reviewSoon ? "text-yellow-600" : ""}`}>
              {chemical.reviewDate
                ? <>{reviewOverdue ? <AlertTriangle className="h-3 w-3" /> : reviewSoon ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {format(new Date(chemical.reviewDate), "d. MMMM yyyy", { locale: nb })}</>
                : <span className="text-muted-foreground">Ikke satt</span>
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Utløpsdato</p>
            <p className={`text-sm flex items-center gap-1 ${expiresOverdue ? "text-red-600" : expiresSoon ? "text-yellow-600" : ""}`}>
              {chemical.expiresAt
                ? <>{expiresOverdue ? <AlertTriangle className="h-3 w-3" /> : expiresSoon ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {format(new Date(chemical.expiresAt), "d. MMMM yyyy", { locale: nb })}</>
                : <span className="text-muted-foreground">Ikke satt</span>
              }
            </p>
          </div>
        </div>
      </section>

      {/* Audit log */}
      {isHrAdmin && chemical.auditLogs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endringslogg</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {chemical.auditLogs.map((log) => (
              <div key={log.id} className="px-4 py-2 flex items-center justify-between gap-4 text-sm">
                <span>{ACTION_LABELS[log.action] ?? log.action} av {log.actor.fullName}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(log.createdAt), "d. MMM yyyy HH:mm", { locale: nb })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
