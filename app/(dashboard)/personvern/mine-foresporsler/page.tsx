import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Shield, Plus, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { NewDataRequestForm } from "@/features/data-requests/NewDataRequestForm";

export const metadata = { title: "Mine forespørsler – Personvern" };

const TYPE_LABELS: Record<string, string> = {
  ACCESS: "Innsyn (art. 15)",
  PORTABILITY: "Dataportabilitet (art. 20)",
  RECTIFICATION: "Retting (art. 16)",
  ERASURE: "Sletting (art. 17)",
  OTHER: "Annet",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  PENDING:     { label: "Til behandling", variant: "outline",     icon: Clock },
  IN_PROGRESS: { label: "Under behandling", variant: "secondary", icon: Loader2 },
  COMPLETED:   { label: "Fullført",       variant: "default",    icon: CheckCircle2 },
  REJECTED:    { label: "Avslått",        variant: "destructive", icon: XCircle },
};

export default async function MineForesporslerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const requests = await db.dataSubjectRequest.findMany({
    where: { requesterId: profile.id },
    include: { handledBy: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/personvern"><ArrowLeft className="h-4 w-4 mr-1" />Personvern</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Mine personvernforespørsler
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Be om innsyn i, eksport av, retting av eller sletting av dine personopplysninger.
          Forespørselen behandles av HR innen 30 dager (GDPR art. 12).
        </p>
      </div>

      {/* Ny forespørsel */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Send ny forespørsel</h2>
        <NewDataRequestForm />
      </div>

      {/* Eksisterende forespørsler */}
      {requests.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tidligere forespørsler
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {requests.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{TYPE_LABELS[r.type] ?? r.type}</p>
                    <Badge variant={cfg.variant} className="text-xs flex items-center gap-1">
                      <Icon className="h-3 w-3" />{cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sendt {format(new Date(r.createdAt), "d. MMM yyyy", { locale: nb })}
                    {r.handledBy && ` · Behandlet av ${r.handledBy.fullName}`}
                  </p>
                  {r.adminNote && (
                    <p className="text-xs bg-muted rounded px-2 py-1 mt-1">{r.adminNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
