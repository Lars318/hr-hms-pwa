import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/features/employees/EmployeeForm";
import { AvatarUpload } from "@/features/profile/AvatarUpload";
import { AssignmentManager } from "@/features/employees/AssignmentManager";

interface Props {
  params: { id: string };
}

export const metadata = { title: "Rediger ansatt – HR/HMS" };

export default async function RedigerAnsattPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "HR")) redirect("/ingen-tilgang");

  const [profile, departments, allProfiles] = await Promise.all([
    db.profile.findUnique({ where: { id: params.id }, include: { department: true, manager: { select: { id: true, fullName: true } } } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.profile.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);

  if (!profile) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/ansatte/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rediger ansatt</h1>
          <p className="text-sm text-muted-foreground">{profile.fullName}</p>
        </div>
      </div>

      <AvatarUpload
        profileId={profile.id}
        currentUrl={profile.avatarUrl}
        fullName={profile.fullName}
      />

      <EmployeeForm profile={profile} departments={departments} allProfiles={allProfiles} mode="edit" />

      <div className="rounded-2xl border bg-card px-5 py-5 space-y-1">
        <p className="text-sm font-semibold mb-3">Lokasjoner</p>
        <AssignmentManager profileId={params.id} />
      </div>
    </div>
  );
}
