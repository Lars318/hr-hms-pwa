import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { StartProcessForm } from "@/features/onboarding/StartProcessForm";

export const metadata = { title: "Onboarding/offboarding – Admin" };

export default async function OnboardingAdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/ingen-tilgang");

  const [processes, profiles, templates, hrProfiles] = await Promise.all([
    db.onboardingProcess.findMany({
      where: { status: "ACTIVE" },
      include: {
        employee: { select: { id: true, fullName: true } },
        responsibleHr: { select: { fullName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    db.onboardingTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Onboarding / Offboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start og følg opp onboarding- og offboarding-prosesser.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/onboarding/maler">Rediger maler</Link>
        </Button>
      </div>

      {/* Aktive prosesser */}
      <section className="space-y-3">
        <h2 className="font-semibold">Aktive prosesser ({processes.length})</h2>
        {processes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen aktive prosesser.</p>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {processes.map((p) => (
              <Link key={p.id} href={`/admin/onboarding/${p.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.employee.fullName}</p>
                    <Badge variant={p.type === "ONBOARDING" ? "default" : "secondary"} className="text-xs">
                      {p.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start: {format(new Date(p.startDate), "d. MMM yyyy", { locale: nb })}
                    {p.responsibleHr && ` · HR: ${p.responsibleHr.fullName}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{p._count.tasks} oppgaver</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Start ny prosess */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Start ny prosess
        </h2>
        <StartProcessForm profiles={profiles} templates={templates} hrProfiles={hrProfiles} />
      </section>
    </div>
  );
}
