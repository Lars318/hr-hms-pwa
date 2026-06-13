import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LeaveRequestForm } from "@/features/leave/LeaveRequestForm";

export const metadata = { title: "Rediger søknad – HR/HMS" };

export default async function RedigerFravaerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const req = await db.leaveRequest.findUnique({ where: { id: params.id } });
  if (!req) notFound();

  const canEdit =
    req.status === "PENDING" &&
    (req.employeeId === profile.id ||
      profile.role === "ADMIN" ||
      profile.role === "HR");

  if (!canEdit) redirect(`/fravaer/${params.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/fravaer/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rediger søknad</h1>
          <p className="text-sm text-muted-foreground">Kun PENDING søknader kan redigeres.</p>
        </div>
      </div>

      <LeaveRequestForm
        mode="edit"
        existing={{
          id: req.id,
          type: req.type,
          startDate: req.startDate,
          endDate: req.endDate,
          reason: req.reason,
        }}
      />
    </div>
  );
}
