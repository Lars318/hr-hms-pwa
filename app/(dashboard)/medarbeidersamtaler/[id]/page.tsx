import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { MessageSquare, ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ReviewNotesForm } from "@/features/reviews/ReviewNotesForm";
import type { ReviewStatus } from "@prisma/client";

export const metadata = { title: "Medarbeidersamtale" };

const STATUS_CONFIG: Record<ReviewStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  SCHEDULED: { label: "Planlagt", variant: "outline" },
  COMPLETED: { label: "Gjennomført", variant: "default" },
  CANCELLED: { label: "Avlyst", variant: "destructive" },
};

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const review = await db.employeeReview.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, title: true, email: true } },
      manager: { select: { id: true, fullName: true } },
      createdBy: { select: { fullName: true } },
    },
  });

  if (!review) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER" && review.managerId === profile.id;
  const isEmployee = review.employeeId === profile.id;

  if (!isHrAdmin && !isManager && !isEmployee) redirect("/ingen-tilgang");

  const cfg = STATUS_CONFIG[review.status];

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/medarbeidersamtaler"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Medarbeidersamtale
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{review.employee.fullName}</p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Tidspunkt</p>
            <p>{format(new Date(review.scheduledAt), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}</p>
          </div>
        </div>
        {review.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Sted</p>
              <p>{review.location}</p>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Ansatt</p>
          <p>{review.employee.fullName}</p>
          {review.employee.title && <p className="text-muted-foreground">{review.employee.title}</p>}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Leder</p>
          <p>{review.manager.fullName}</p>
        </div>
      </div>

      {/* Agenda (read-only for employee if set) */}
      {review.agenda && isEmployee && !isManager && !isHrAdmin && (
        <div className="rounded-xl border p-4 space-y-1">
          <p className="text-sm font-medium">Agenda</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{review.agenda}</p>
        </div>
      )}

      {/* Goals (read-only for employee) */}
      {review.goals && isEmployee && !isManager && !isHrAdmin && (
        <div className="rounded-xl border p-4 space-y-1">
          <p className="text-sm font-medium">Mål og oppfølging</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{review.goals}</p>
        </div>
      )}

      {/* Shared notes (read-only for employee) */}
      {review.sharedNotes && isEmployee && !isManager && !isHrAdmin && (
        <div className="rounded-xl border p-4 space-y-1">
          <p className="text-sm font-medium">Referat</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{review.sharedNotes}</p>
        </div>
      )}

      {/* Edit form for HR/Admin/Manager, and for employee to add sharedNotes */}
      <div className="rounded-xl border p-4">
        <h2 className="text-sm font-semibold mb-4">
          {isEmployee && !isManager && !isHrAdmin ? "Din kommentar" : "Rediger samtale"}
        </h2>
        <ReviewNotesForm
          id={review.id}
          role={profile.role}
          isManager={isManager}
          currentStatus={review.status}
          sharedNotes={review.sharedNotes}
          managerNotes={isEmployee && !isManager && !isHrAdmin ? null : review.managerNotes}
          goals={review.goals}
          agenda={review.agenda}
        />
      </div>
    </div>
  );
}
