import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { IncidentForm } from "@/features/incidents/IncidentForm";

interface Props { params: { id: string } }

export const metadata = { title: "Rediger avvik – HR/HMS" };

export default async function RedigerAvvikPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const incident = await db.incident.findUnique({
    where: { id: params.id },
    include: {
      reportedBy: { select: { id: true, fullName: true, email: true } },
      assignedTo: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  });

  if (!incident) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManagerOfDept = profile.role === "MANAGER" && incident.departmentId === profile.departmentId;
  const isOwnerAndOpen = incident.reportedById === profile.id && incident.status === "OPEN";

  if (!isHrAdmin && !isManagerOfDept && !isOwnerAndOpen) redirect("/ingen-tilgang");

  const [departments, profiles] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/avvik/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rediger avvik</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{incident.title}</p>
        </div>
      </div>

      <IncidentForm
        mode="edit"
        incident={incident}
        departments={departments}
        profiles={profiles}
        viewerRole={profile.role}
        viewerDepartmentId={profile.departmentId}
      />
    </div>
  );
}
