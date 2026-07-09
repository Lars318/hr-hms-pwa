import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ShieldAlert, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { NewPersonnelCaseForm } from "@/features/personnel-cases/NewPersonnelCaseForm";
import type { PersonnelCaseType, PersonnelCaseStatus } from "@prisma/client";

export const metadata = { title: "Personalsaker – Admin" };

const TYPE_LABELS: Record<PersonnelCaseType, string> = {
  WARNING: "Advarsel",
  PERFORMANCE_PLAN: "Oppfølgingsplan",
  TERMINATION_NOTICE: "Varsel om oppsigelse",
  SUSPENSION: "Suspensjon",
  OTHER: "Annet",
};

const STATUS_CONFIG: Record<PersonnelCaseStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Åpen", variant: "destructive" },
  CLOSED: { label: "Avsluttet", variant: "secondary" },
  ARCHIVED: { label: "Arkivert", variant: "outline" },
};

export default async function PersonalsakerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";
  if (!isHrAdmin && !isManager) redirect("/ingen-tilgang");

  const where = isHrAdmin
    ? {}
    : { responsibleManagerId: profile.id };

  const [cases, employees, managers] = await Promise.all([
    db.personnelCase.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, title: true } },
        responsibleManager: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isHrAdmin
      ? db.profile.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
      : Promise.resolve([]),
    isHrAdmin
      ? db.profile.findMany({ where: { status: "ACTIVE", role: { in: ["ADMIN", "HR", "MANAGER"] } }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          Personalsaker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Formelle advarsler og personalsaker. Kun HR og ADMIN har full tilgang.
        </p>
      </div>

      <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
        Disse sakene er svært sensitive. De er ikke synlige for ansatte og inngår ikke i generelle rapporter.
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Saker ({cases.length})</h2>
        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen saker registrert.</p>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {cases.map((c) => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <Link key={c.id} href={`/admin/personalsaker/${c.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{c.employee.fullName}</p>
                      <span className="text-xs text-muted-foreground">{TYPE_LABELS[c.type]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.issuedAt), "d. MMM yyyy", { locale: nb })}
                      {c.responsibleManager && ` · Leder: ${c.responsibleManager.fullName}`}
                      {c.isAcknowledged && " · Kvittert"}
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
            <Plus className="h-4 w-4" />Opprett ny sak
          </h2>
          <NewPersonnelCaseForm employees={employees} managers={managers} />
        </section>
      )}
    </div>
  );
}
