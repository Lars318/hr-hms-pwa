import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { SickCaseDetail } from "@/features/sickLeave/SickCaseDetail";

interface Props { params: { id: string } }

export default async function SykefravaerDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer) redirect("/ingen-tilgang");

  const sickCase = await db.sickLeaveCase.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { id: true, fullName: true, email: true, departmentId: true } },
      steps: {
        orderBy: { dueDate: "asc" },
        include: { completedBy: { select: { id: true, fullName: true } } },
      },
    },
  });
  if (!sickCase) notFound();

  const isHrAdmin = viewer.role === "ADMIN" || viewer.role === "HR";
  const isOwn = sickCase.employeeId === viewer.id;
  const isManagerOfDept =
    viewer.role === "MANAGER" && sickCase.employee.departmentId === viewer.departmentId;

  if (!isHrAdmin && !isOwn && !isManagerOfDept) redirect("/ingen-tilgang");

  const canManage = isHrAdmin || isManagerOfDept;

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/sykefravaer">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
        </Link>
      </Button>
      <SickCaseDetail sickCase={sickCase as never} canManage={canManage} />
    </div>
  );
}
