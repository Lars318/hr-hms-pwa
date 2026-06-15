import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FileText, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ContractFileUpload } from "@/features/contracts/ContractFileUpload";
import { ContractEditForm } from "@/features/contracts/ContractEditForm";
import type { ContractType, ContractStatus } from "@prisma/client";

export const metadata = { title: "Kontrakt" };

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

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const c = await db.contract.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, title: true, email: true } },
      createdBy: { select: { fullName: true } },
    },
  });

  if (!c) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isEmployee = profile.role === "EMPLOYEE" && c.employeeId === profile.id;

  if (!isHrAdmin && profile.role !== "MANAGER" && !isEmployee) redirect("/ingen-tilgang");
  if (isEmployee && !c.sharedWithEmployee) redirect("/ingen-tilgang");

  const cfg = STATUS_CONFIG[c.status];

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/kontrakter"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {c.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.employee.fullName} · {TYPE_LABELS[c.type]}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3 text-sm">
        {c.startDate && (
          <div>
            <p className="text-xs text-muted-foreground">Startdato</p>
            <p>{format(new Date(c.startDate), "d. MMMM yyyy", { locale: nb })}</p>
          </div>
        )}
        {c.endDate && (
          <div>
            <p className="text-xs text-muted-foreground">Sluttdato</p>
            <p>{format(new Date(c.endDate), "d. MMMM yyyy", { locale: nb })}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Opprettet av</p>
          <p>{c.createdBy.fullName}</p>
        </div>
        {isHrAdmin && (
          <div>
            <p className="text-xs text-muted-foreground">Delt med ansatt</p>
            <p>{c.sharedWithEmployee ? (c.sharedAt ? format(new Date(c.sharedAt), "d. MMM yyyy", { locale: nb }) : "Ja") : "Nei"}</p>
          </div>
        )}
      </div>

      {c.notes && (
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Notat</p>
          <p className="text-sm whitespace-pre-line">{c.notes}</p>
        </div>
      )}

      {/* File section */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Kontraktsfil</h2>
        {isHrAdmin ? (
          <ContractFileUpload
            contractId={c.id}
            hasFile={!!c.fileKey}
            fileName={c.fileName}
          />
        ) : c.fileKey ? (
          <ContractFileUpload
            contractId={c.id}
            hasFile={true}
            fileName={c.fileName}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Ingen fil lastet opp.</p>
        )}
      </div>

      {/* HR edit */}
      {isHrAdmin && (
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-sm font-semibold">Rediger kontrakt</h2>
          <ContractEditForm
            id={c.id}
            currentStatus={c.status}
            currentTitle={c.title}
            currentNotes={c.notes ?? ""}
            sharedWithEmployee={c.sharedWithEmployee}
          />
        </div>
      )}
    </div>
  );
}
