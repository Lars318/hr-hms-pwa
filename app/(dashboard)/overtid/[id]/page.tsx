import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { OvertimeDetail } from "@/features/overtime/OvertimeDetail";

export const metadata = { title: "Overtidsregistrering – HR/HMS" };

export default async function OvertidDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const entry = await db.overtimeEntry.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, title: true, departmentId: true } },
      approvedBy: { select: { id: true, fullName: true } },
      location: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
  if (!entry) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManager = profile.role === "MANAGER" && profile.departmentId === entry.employee.departmentId;
  const isOwner = entry.employeeId === profile.id;
  if (!isHrAdmin && !isManager && !isOwner) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/overtid">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Overtidsregistrering</h1>
      </div>
      <OvertimeDetail
        entry={entry}
        viewerRole={profile.role}
        viewerId={profile.id}
      />
    </div>
  );
}
