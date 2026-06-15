import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import { ActionStatusBadge } from "@/features/actions/ActionStatusBadge";
import { ActionPriorityBadge } from "@/features/actions/ActionPriorityBadge";
import { ActionStatusChanger } from "@/features/actions/ActionStatusChanger";
import { CommentThread } from "@/features/comments/CommentThread";

interface Props {
  params: { id: string };
}

export default async function TiltakDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const action = await db.action.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, fullName: true } },
      department: { select: { id: true, name: true } },
      riskItem: { select: { id: true, hazard: true, assessmentId: true } },
    },
  });

  if (!action) notFound();

  // Access check
  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isAssigned = action.assignedToId === profile.id;
  const isManager = profile.role === "MANAGER" && action.departmentId === profile.departmentId;
  if (!isHrAdmin && !isAssigned && !isManager) redirect("/tiltak");

  const canChangeStatus = isHrAdmin || isAssigned || isManager;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-sm text-muted-foreground mb-1">
          <Link href="/tiltak" className="hover:underline">Tiltak</Link>
          {" / "}
          <span>{action.title}</span>
        </div>
        <h1 className="text-2xl font-bold">{action.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionPriorityBadge priority={action.priority} />
        <ActionStatusBadge status={action.status} />
      </div>

      {action.description && (
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="text-sm whitespace-pre-wrap">{action.description}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Ansvarlig</dt>
          <dd className="mt-0.5 font-medium">{action.assignedTo?.fullName ?? "—"}</dd>
        </div>
        {action.department && (
          <div>
            <dt className="text-muted-foreground text-xs">Avdeling</dt>
            <dd className="mt-0.5">{action.department.name}</dd>
          </div>
        )}
        {action.dueDate && (
          <div>
            <dt className="text-muted-foreground text-xs">Frist</dt>
            <dd className="mt-0.5">{format(new Date(action.dueDate), "d. MMMM yyyy", { locale: nb })}</dd>
          </div>
        )}
        {action.completedAt && (
          <div>
            <dt className="text-muted-foreground text-xs">Fullført</dt>
            <dd className="mt-0.5 text-green-700 font-medium">
              {format(new Date(action.completedAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground text-xs">Kilde</dt>
          <dd className="mt-0.5">
            {action.riskItem ? (
              <Link href={`/risiko/${action.riskItem.assessmentId}`} className="underline underline-offset-2 text-primary">
                Risikopunkt: {action.riskItem.hazard}
              </Link>
            ) : (
              <span className="text-muted-foreground">{action.sourceType}</span>
            )}
          </dd>
        </div>
      </dl>

      {canChangeStatus && (
        <>
          <Separator />
          <ActionStatusChanger actionId={action.id} currentStatus={action.status} />
        </>
      )}

      <Separator />
      <CommentThread entityType="ACTION" entityId={action.id} currentProfileId={profile.id} role={profile.role} />
    </div>
  );
}
