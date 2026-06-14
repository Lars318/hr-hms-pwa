import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ProcessStatusForm } from "@/features/onboarding/ProcessStatusForm";
import { OnboardingTaskList } from "@/features/onboarding/OnboardingTaskList";

export const metadata = { title: "Prosessdetalj – Onboarding/offboarding" };

const STATUS_CONFIG = {
  ACTIVE: { label: "Aktiv", variant: "default" as const },
  COMPLETED: { label: "Fullført", variant: "secondary" as const },
  CANCELLED: { label: "Avbrutt", variant: "destructive" as const },
};

export default async function OnboardingProcessDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/ingen-tilgang");

  const process = await db.onboardingProcess.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, email: true, title: true } },
      responsibleHr: { select: { fullName: true } },
      template: { select: { name: true } },
      tasks: {
        orderBy: { order: "asc" },
        include: { completedBy: { select: { fullName: true } } },
      },
    },
  });

  if (!process) notFound();

  const cfg = STATUS_CONFIG[process.status];
  const completed = process.tasks.filter((t) => t.status !== "PENDING").length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/onboarding"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {process.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}: {process.employee.fullName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {process.employee.email}
            {process.employee.title && ` · ${process.employee.title}`}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm rounded-xl border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Startdato</p>
          <p>{format(new Date(process.startDate), "d. MMMM yyyy", { locale: nb })}</p>
        </div>
        {process.completedAt && (
          <div>
            <p className="text-xs text-muted-foreground">Fullført</p>
            <p>{format(new Date(process.completedAt), "d. MMMM yyyy", { locale: nb })}</p>
          </div>
        )}
        {process.responsibleHr && (
          <div>
            <p className="text-xs text-muted-foreground">Ansvarlig HR</p>
            <p>{process.responsibleHr.fullName}</p>
          </div>
        )}
        {process.template && (
          <div>
            <p className="text-xs text-muted-foreground">Mal brukt</p>
            <p>{process.template.name}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Fremdrift</p>
          <p>{completed}/{process.tasks.length} oppgaver</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Oppgaver</h2>
        <OnboardingTaskList tasks={process.tasks} processId={process.id} />
      </section>

      <ProcessStatusForm
        id={process.id}
        currentStatus={process.status as "ACTIVE" | "COMPLETED" | "CANCELLED"}
        currentNotes={process.notes ?? ""}
      />
    </div>
  );
}
