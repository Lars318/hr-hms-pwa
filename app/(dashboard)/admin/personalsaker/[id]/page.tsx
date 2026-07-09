import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { PersonnelCaseEditForm } from "@/features/personnel-cases/PersonnelCaseEditForm";
import type { PersonnelCaseType, PersonnelCaseStatus } from "@prisma/client";

export const metadata = { title: "Personalsak" };

const TYPE_LABELS: Record<PersonnelCaseType, string> = {
  WARNING: "Skriftlig advarsel",
  PERFORMANCE_PLAN: "Oppfølgingsplan (PIP)",
  TERMINATION_NOTICE: "Varsel om oppsigelse",
  SUSPENSION: "Suspensjon",
  OTHER: "Annet",
};

const STATUS_CONFIG: Record<PersonnelCaseStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Åpen", variant: "destructive" },
  CLOSED: { label: "Avsluttet", variant: "secondary" },
  ARCHIVED: { label: "Arkivert", variant: "outline" },
};

export default async function PersonnelCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";
  if (!isHrAdmin && !isManager) redirect("/ingen-tilgang");

  const c = await db.personnelCase.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { fullName: true, title: true, email: true } },
      responsibleManager: { select: { fullName: true } },
      createdBy: { select: { fullName: true } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: { select: { fullName: true } } },
      },
    },
  });

  if (!c) notFound();

  // Manager can only see if assigned
  if (isManager && !isHrAdmin && c.responsibleManagerId !== profile.id) redirect("/ingen-tilgang");

  const cfg = STATUS_CONFIG[c.status];

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/personalsaker"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            {TYPE_LABELS[c.type]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.employee.fullName}
            {c.employee.title && ` · ${c.employee.title}`}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Dato</p>
          <p>{format(new Date(c.issuedAt), "d. MMMM yyyy", { locale: nb })}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Opprettet av</p>
          <p>{c.createdBy.fullName}</p>
        </div>
        {c.responsibleManager && (
          <div>
            <p className="text-xs text-muted-foreground">Ansvarlig leder</p>
            <p>{c.responsibleManager.fullName}</p>
          </div>
        )}
        {c.closedAt && (
          <div>
            <p className="text-xs text-muted-foreground">Avsluttet</p>
            <p>{format(new Date(c.closedAt), "d. MMMM yyyy", { locale: nb })}</p>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {c.isAcknowledged
            ? <><CheckCircle2 className="h-4 w-4 text-green-600" /><span>Kvittert av ansatt {c.acknowledgedAt ? format(new Date(c.acknowledgedAt), "d. MMM yyyy", { locale: nb }) : ""}</span></>
            : <span className="text-muted-foreground">Ikke kvittert</span>
          }
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-4">
        <h2 className="text-sm font-semibold">Rediger sak</h2>
        <PersonnelCaseEditForm
          id={c.id}
          isHrAdmin={isHrAdmin}
          currentStatus={c.status}
          summary={c.summary}
          internalNote={isHrAdmin ? (c.internalNote ?? null) : null}
          outcomeNote={c.outcomeNote ?? null}
          isAcknowledged={c.isAcknowledged}
        />
      </div>

      {c.auditLogs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Aktivitetslogg</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {c.auditLogs.map((log) => (
              <div key={log.id} className="px-4 py-2.5 text-xs flex justify-between gap-2">
                <span><span className="font-medium">{log.actor.fullName}</span> — {log.action.toLowerCase().replace(/_/g, " ")}</span>
                <span className="text-muted-foreground shrink-0">{format(new Date(log.createdAt), "d. MMM HH:mm", { locale: nb })}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
