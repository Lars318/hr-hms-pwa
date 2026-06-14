import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { DataRequestAdminClient } from "@/features/data-requests/DataRequestAdminClient";

export const metadata = { title: "Forespørsel – Personvern admin" };

const TYPE_LABELS: Record<string, string> = {
  ACCESS: "Innsyn (art. 15)",
  PORTABILITY: "Dataportabilitet (art. 20)",
  RECTIFICATION: "Retting (art. 16)",
  ERASURE: "Sletting (art. 17)",
  OTHER: "Annet",
};

export default async function DataRequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/ingen-tilgang");

  const request = await db.dataSubjectRequest.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, fullName: true, email: true, title: true } },
      handledBy: { select: { fullName: true } },
    },
  });

  if (!request) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/compliance"><ArrowLeft className="h-4 w-4 mr-1" />Tilbake</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Personvernforespørsel
        </h1>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Ansatt</p>
            <p className="font-medium">{request.requester.fullName}</p>
            <p className="text-muted-foreground">{request.requester.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium">{TYPE_LABELS[request.type] ?? request.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mottatt</p>
            <p>{format(new Date(request.createdAt), "d. MMMM yyyy HH:mm", { locale: nb })}</p>
          </div>
          {request.completedAt && (
            <div>
              <p className="text-xs text-muted-foreground">Behandlet</p>
              <p>{format(new Date(request.completedAt), "d. MMMM yyyy", { locale: nb })}</p>
              {request.handledBy && <p className="text-muted-foreground">{request.handledBy.fullName}</p>}
            </div>
          )}
        </div>
        {request.message && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Melding fra ansatt</p>
            <p className="text-sm bg-muted rounded px-3 py-2">{request.message}</p>
          </div>
        )}
      </div>

      <DataRequestAdminClient
        id={request.id}
        currentStatus={request.status}
        currentAdminNote={request.adminNote ?? ""}
      />
    </div>
  );
}
