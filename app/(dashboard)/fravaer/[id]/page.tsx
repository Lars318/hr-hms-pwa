import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LeaveRequestStatusBadge } from "@/features/leave/LeaveRequestStatusBadge";
import { LeaveRequestTypeBadge } from "@/features/leave/LeaveRequestTypeBadge";
import { LeaveDecisionForm } from "@/features/leave/LeaveDecisionForm";
import { CancelLeaveButton } from "@/features/leave/CancelLeaveButton";
import { LEAVE_TYPE_LABELS } from "@/lib/leave";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: "Fraværssøknad – HR/HMS" };
}

export default async function FravaerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const req = await db.leaveRequest.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, fullName: true } },
    },
  });

  if (!req) notFound();

  // Access control
  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isOwner = req.employeeId === profile.id;
  const isManagerOfDept =
    profile.role === "MANAGER" && req.departmentId === profile.departmentId;

  if (!isHrAdmin && !isOwner && !isManagerOfDept) redirect("/ingen-tilgang");

  const canDecide =
    req.status === "PENDING" &&
    !isOwner &&
    (isHrAdmin || isManagerOfDept);

  const canCancel = req.status === "PENDING" && (isOwner || isHrAdmin);
  const canEdit = req.status === "PENDING" && (isOwner || isHrAdmin);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fravaer">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {LEAVE_TYPE_LABELS[req.type]}
            </h1>
            <LeaveRequestStatusBadge status={req.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Søknad #{req.id.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/fravaer/${req.id}/rediger`}>
                <Pencil className="h-4 w-4 mr-1" /> Rediger
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border bg-card divide-y">
        <div className="grid grid-cols-2 gap-0">
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Ansatt</p>
            <p className="text-sm font-medium mt-0.5">{req.employee.fullName}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Avdeling</p>
            <p className="text-sm font-medium mt-0.5">{req.department?.name ?? "—"}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Type</p>
            <div className="mt-1"><LeaveRequestTypeBadge type={req.type} /></div>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Antall dager</p>
            <p className="text-sm font-medium mt-0.5">{req.days} dag{req.days !== 1 ? "er" : ""}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Periode</p>
            <p className="text-sm font-medium mt-0.5">
              {format(new Date(req.startDate), "d. MMMM yyyy", { locale: nb })}
              {" – "}
              {format(new Date(req.endDate), "d. MMMM yyyy", { locale: nb })}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Sendt inn</p>
            <p className="text-sm font-medium mt-0.5">
              {format(new Date(req.createdAt), "d. MMMM yyyy, HH:mm", { locale: nb })}
            </p>
          </div>
        </div>

        {req.reason && (
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Begrunnelse</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{req.reason}</p>
          </div>
        )}

        {(req.status === "APPROVED" || req.status === "REJECTED") && (
          <div className="px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              {req.status === "APPROVED" ? "Godkjent" : "Avslått"} av{" "}
              {req.decidedBy?.fullName ?? "ukjent"}{" "}
              {req.decidedAt && format(new Date(req.decidedAt), "d. MMMM yyyy", { locale: nb })}
            </p>
            {req.managerComment && (
              <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">
                {req.managerComment}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Decision form */}
      {canDecide && (
        <LeaveDecisionForm
          requestId={req.id}
          employeeName={req.employee.fullName}
        />
      )}

      {/* Cancel button */}
      {canCancel && (
        <CancelLeaveButton requestId={req.id} />
      )}
    </div>
  );
}
