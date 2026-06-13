import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { IncidentStatusBadge } from "@/components/shared/IncidentStatusBadge";
import { StatusChangeForm } from "@/features/incidents/StatusChangeForm";
import { AuditLogList } from "@/features/incidents/AuditLogList";
import { AttachmentSection } from "@/features/incidents/AttachmentSection";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const incident = await db.incident.findUnique({ where: { id: params.id } });
  return { title: incident ? `${incident.title} – HR/HMS` : "Avvik – HR/HMS" };
}

export default async function AvvikDetaljPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const incident = await db.incident.findUnique({
    where: { id: params.id },
    include: {
      reportedBy: { select: { id: true, fullName: true, email: true } },
      assignedTo: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true } },
      auditLogs: {
        include: { actor: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!incident) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManagerOfDept =
    profile.role === "MANAGER" && incident.departmentId === profile.departmentId;
  const isOwner = incident.reportedById === profile.id;

  if (!isHrAdmin && !isManagerOfDept && !isOwner) redirect("/ingen-tilgang");

  const canEdit = isHrAdmin || isManagerOfDept || (isOwner && incident.status === "OPEN");

  // Kan laste opp: alle som kan se avviket
  const canUpload = isHrAdmin || isManagerOfDept || isOwner;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/avvik">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        {canEdit && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/avvik/${incident.id}/rediger`}>
              <Pencil className="h-4 w-4 mr-1" /> Rediger
            </Link>
          </Button>
        )}
      </div>

      {/* Tittel og badges */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
        </div>
      </div>

      {/* Beskrivelse */}
      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
      </div>

      <Separator />

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Rapportert av</dt>
          <dd className="font-medium mt-0.5">{incident.reportedBy.fullName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ansvarlig</dt>
          <dd className="font-medium mt-0.5">{incident.assignedTo?.fullName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Avdeling</dt>
          <dd className="font-medium mt-0.5">{incident.department?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Hendelsesdato</dt>
          <dd className="font-medium mt-0.5">
            {format(new Date(incident.occurredAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
          </dd>
        </div>
        {incident.dueDate && (
          <div>
            <dt className="text-muted-foreground">Frist</dt>
            <dd className="font-medium mt-0.5">
              {format(new Date(incident.dueDate), "d. MMMM yyyy, HH:mm", { locale: nb })}
            </dd>
          </div>
        )}
        {incident.resolvedAt && (
          <div>
            <dt className="text-muted-foreground">Løst</dt>
            <dd className="font-medium mt-0.5">
              {format(new Date(incident.resolvedAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Registrert</dt>
          <dd className="font-medium mt-0.5">
            {format(new Date(incident.createdAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
          </dd>
        </div>
      </dl>

      <Separator />

      {/* Vedlegg */}
      <AttachmentSection
        incidentId={incident.id}
        incidentStatus={incident.status}
        viewerRole={profile.role}
        viewerProfileId={profile.id}
        canUpload={canUpload}
      />


      <Separator />

      {/* Statusendring */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Status</h2>
        <StatusChangeForm
          incidentId={incident.id}
          currentStatus={incident.status}
          viewerRole={profile.role}
        />
      </div>

      <Separator />

      {/* Historikk */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Historikk</h2>
        <AuditLogList logs={incident.auditLogs} />
      </div>
    </div>
  );
}
