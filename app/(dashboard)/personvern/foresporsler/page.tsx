import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { DataRequestStatus } from "@prisma/client";

export const metadata = { title: "Personvernforespørsler – Admin" };

const TYPE_LABELS: Record<string, string> = {
  ACCESS: "Innsyn",
  PORTABILITY: "Dataportabilitet",
  RECTIFICATION: "Retting",
  ERASURE: "Sletting",
  OTHER: "Annet",
};

const STATUS_CONFIG: Record<DataRequestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Til behandling", variant: "outline" },
  IN_PROGRESS: { label: "Under behandling", variant: "secondary" },
  COMPLETED: { label: "Fullført", variant: "default" },
  REJECTED: { label: "Avslått", variant: "destructive" },
};

export default async function DataRequestsAdminPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/ingen-tilgang");

  const statusFilter = searchParams.status as DataRequestStatus | undefined;

  const requests = await db.dataSubjectRequest.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      requester: { select: { fullName: true, email: true } },
      handledBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUSES: { value: DataRequestStatus | ""; label: string }[] = [
    { value: "", label: "Alle" },
    { value: "PENDING", label: "Til behandling" },
    { value: "IN_PROGRESS", label: "Under behandling" },
    { value: "COMPLETED", label: "Fullført" },
    { value: "REJECTED", label: "Avslått" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Personvernforespørsler
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          GDPR-forespørsler fra ansatte. Svar innen 30 dager (art. 12).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={s.value ? `/personvern/foresporsler?status=${s.value}` : "/personvern/foresporsler"}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              (statusFilter ?? "") === s.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen forespørsler funnet.</p>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden">
          {requests.map((r) => {
            const cfg = STATUS_CONFIG[r.status];
            return (
              <Link key={r.id} href={`/personvern/foresporsler/${r.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">{r.requester.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[r.type] ?? r.type} · {format(new Date(r.createdAt), "d. MMM yyyy", { locale: nb })}
                  </p>
                </div>
                <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
