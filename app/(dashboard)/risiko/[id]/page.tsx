import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RiskItemList } from "@/features/risk/RiskItemList";
import { ASSESSMENT_STATUS_LABELS } from "@/lib/risk";
import { CommentThread } from "@/features/comments/CommentThread";

interface Props {
  params: { id: string };
}

export default async function RisikovurderingDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const assessment = await db.riskAssessment.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, fullName: true } },
      department: { select: { id: true, name: true } },
      riskItems: {
        include: {
          responsible: { select: { id: true, fullName: true } },
          actions: {
            include: { assignedTo: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ riskLevel: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!assessment) notFound();

  // Access: EMPLOYEE must be in same department
  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isInDept = assessment.departmentId && profile.departmentId === assessment.departmentId;
  if (!isHrAdmin && !isInDept) redirect("/tiltak");

  const canManage =
    isHrAdmin ||
    (profile.role === "MANAGER" && !!isInDept);

  const employees = await db.profile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const statusVariant = (s: string) => {
    if (s === "ACTIVE") return "success";
    if (s === "REVIEW") return "warning";
    if (s === "CLOSED") return "muted";
    return "secondary";
  };

  // Count by risk level
  const levelCount = assessment.riskItems.reduce((acc, item) => {
    acc[item.riskLevel] = (acc[item.riskLevel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            <Link href="/risiko" className="hover:underline">Risikovurderinger</Link>
            {" / "}
            <span>{assessment.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{assessment.title}</h1>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/risiko/${assessment.id}/rediger`}>
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant(assessment.status) as "secondary"}>
            {ASSESSMENT_STATUS_LABELS[assessment.status]}
          </Badge>
          {assessment.department && <Badge variant="outline">{assessment.department.name}</Badge>}
        </div>

        {assessment.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.description}</p>
        )}

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Eier</dt>
            <dd className="mt-0.5 font-medium">{assessment.owner.fullName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Opprettet</dt>
            <dd className="mt-0.5">{format(new Date(assessment.createdAt), "d. MMM yyyy", { locale: nb })}</dd>
          </div>
          {assessment.reviewDate && (
            <div>
              <dt className="text-muted-foreground text-xs">Neste gjennomgang</dt>
              <dd className="mt-0.5">{format(new Date(assessment.reviewDate), "d. MMM yyyy", { locale: nb })}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground text-xs">Risikopunkter</dt>
            <dd className="mt-0.5">{assessment.riskItems.length} totalt</dd>
          </div>
        </dl>

        {/* Risk level summary */}
        {assessment.riskItems.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) =>
              levelCount[lvl] ? (
                <div key={lvl} className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${lvl === "CRITICAL" ? "bg-red-500" : lvl === "HIGH" ? "bg-orange-400" : lvl === "MEDIUM" ? "bg-yellow-400" : "bg-green-400"}`} />
                  {levelCount[lvl]} {lvl === "CRITICAL" ? "kritisk" : lvl === "HIGH" ? "høy" : lvl === "MEDIUM" ? "middels" : "lav"}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Risk items */}
      <div className="space-y-3">
        <h2 className="font-semibold">Risikopunkter</h2>
        <RiskItemList
          assessmentId={assessment.id}
          items={assessment.riskItems as Parameters<typeof RiskItemList>[0]["items"]}
          canManage={canManage}
          employees={employees}
          viewerRole={profile.role}
        />
      </div>

      <Separator />
      <CommentThread entityType="RISK_ASSESSMENT" entityId={assessment.id} currentProfileId={profile.id} role={profile.role} />
    </div>
  );
}
