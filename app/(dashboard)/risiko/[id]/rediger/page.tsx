import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { RiskAssessmentForm } from "@/features/risk/RiskAssessmentForm";

interface Props {
  params: { id: string };
}

export default async function RedigerRisikovurderingPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const assessment = await db.riskAssessment.findUnique({ where: { id: params.id } });
  if (!assessment) notFound();

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManagerInDept = profile.role === "MANAGER" && assessment.departmentId === profile.departmentId;
  if (!isHrAdmin && !isManagerInDept) redirect(`/risiko/${params.id}`);

  const departments = await db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-sm text-muted-foreground mb-1">
          <Link href="/risiko" className="hover:underline">Risikovurderinger</Link>
          {" / "}
          <Link href={`/risiko/${assessment.id}`} className="hover:underline">{assessment.title}</Link>
          {" / "}
          <span>Rediger</span>
        </div>
        <h1 className="text-2xl font-bold">Rediger risikovurdering</h1>
      </div>
      <RiskAssessmentForm mode="edit" assessment={assessment} departments={departments} />
    </div>
  );
}
