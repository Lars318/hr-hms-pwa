import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { OnboardingTaskList } from "@/features/onboarding/OnboardingTaskList";

export const metadata = { title: "Onboarding/offboarding" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const processes = await db.onboardingProcess.findMany({
    where: { employeeId: profile.id, status: "ACTIVE" },
    include: {
      tasks: { orderBy: { order: "asc" } },
      responsibleHr: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Onboarding / Offboarding
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dine aktive onboarding- og offboarding-oppgaver.
        </p>
      </div>

      {processes.length === 0 && (
        <p className="text-sm text-muted-foreground">Du har ingen aktive prosesser for øyeblikket.</p>
      )}

      {processes.map((p) => {
        const total = p.tasks.length;
        const completed = p.tasks.filter((t) => t.status !== "PENDING").length;
        return (
          <section key={p.id} className="rounded-xl border space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {p.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                  </h2>
                  <Badge variant={p.type === "ONBOARDING" ? "default" : "secondary"} className="text-xs">
                    {p.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Startdato: {format(new Date(p.startDate), "d. MMMM yyyy", { locale: nb })}
                </p>
                {p.responsibleHr && (
                  <p className="text-xs text-muted-foreground">
                    Kontaktperson HR: {p.responsibleHr.fullName}
                    {p.responsibleHr.email && ` (${p.responsibleHr.email})`}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{completed}/{total}</p>
                <p className="text-xs text-muted-foreground">oppgaver</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
              />
            </div>

            <OnboardingTaskList tasks={p.tasks} processId={p.id} />
          </section>
        );
      })}
    </div>
  );
}
