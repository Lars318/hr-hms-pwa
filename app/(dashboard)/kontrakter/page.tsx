import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { NewContractForm } from "@/features/contracts/NewContractForm";
import type { ContractType, ContractStatus } from "@prisma/client";

export const metadata = { title: "Kontrakter" };

const TYPE_LABELS: Record<ContractType, string> = {
  EMPLOYMENT: "Ansettelseskontrakt",
  AMENDMENT: "Tillegg/endring",
  TERMINATION: "Opphørsavtale",
  OTHER: "Annet",
};

const STATUS_CONFIG: Record<ContractStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Utkast", variant: "outline" },
  ACTIVE: { label: "Aktiv", variant: "default" },
  EXPIRED: { label: "Utløpt", variant: "secondary" },
  TERMINATED: { label: "Avsluttet", variant: "destructive" },
};

export default async function KontrakterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER";
  const isEmployee = profile.role === "EMPLOYEE";

  const where = isEmployee
    ? { employeeId: profile.id, sharedWithEmployee: true }
    : {};

  const [contracts, employees] = await Promise.all([
    db.contract.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true } },
        createdBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isHrAdmin
      ? db.profile.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Kontrakter
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEmployee ? "Dine kontrakter." : "Alle ansattkontrakter."}
        </p>
      </div>

      <section className="space-y-2">
        {contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen kontrakter registrert.</p>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {contracts.map((c) => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <Link key={c.id} href={`/kontrakter/${c.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {!isEmployee && `${c.employee.fullName} · `}
                      {TYPE_LABELS[c.type]}
                      {c.startDate && ` · ${format(new Date(c.startDate), "d. MMM yyyy", { locale: nb })}`}
                      {c.fileKey && " · Fil lastet opp"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!c.sharedWithEmployee && isHrAdmin && (
                      <span className="text-xs text-muted-foreground">Ikke delt</span>
                    )}
                    <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {isHrAdmin && (
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />Opprett kontrakt
          </h2>
          <NewContractForm employees={employees} />
        </section>
      )}
    </div>
  );
}
