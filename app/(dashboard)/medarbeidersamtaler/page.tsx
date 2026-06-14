import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ScheduleReviewForm } from "@/features/reviews/ScheduleReviewForm";
import type { ReviewStatus } from "@prisma/client";

export const metadata = { title: "Medarbeidersamtaler" };

const STATUS_CONFIG: Record<ReviewStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  SCHEDULED: { label: "Planlagt", variant: "outline" },
  COMPLETED: { label: "Gjennomført", variant: "default" },
  CANCELLED: { label: "Avlyst", variant: "destructive" },
};

export default async function MedarbeidersamtalerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";

  const where = isHrAdmin
    ? {}
    : isManager
    ? { managerId: profile.id }
    : { employeeId: profile.id };

  const reviews = await db.employeeReview.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, title: true } },
      manager: { select: { id: true, fullName: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const employees = isHrAdmin
    ? await db.profile.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
    : [];
  const managers = isHrAdmin
    ? await db.profile.findMany({ where: { status: "ACTIVE", role: { in: ["ADMIN", "HR", "MANAGER"] } }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
    : [];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Medarbeidersamtaler
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isHrAdmin ? "Alle samtaler i organisasjonen." : "Dine planlagte og gjennomførte samtaler."}
        </p>
      </div>

      <section className="space-y-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen samtaler registrert.</p>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {reviews.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              return (
                <Link key={r.id} href={`/medarbeidersamtaler/${r.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium">{r.employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Leder: {r.manager.fullName} · {format(new Date(r.scheduledAt), "d. MMM yyyy HH:mm", { locale: nb })}
                    </p>
                  </div>
                  <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {isHrAdmin && (
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />Planlegg ny samtale
          </h2>
          <ScheduleReviewForm employees={employees} managers={managers} />
        </section>
      )}
    </div>
  );
}
