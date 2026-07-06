import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ProfileTabs } from "@/features/employees/ProfileTabs";
import { OnboardingChecklist } from "@/features/employees/OnboardingChecklist";
import { CertificationSection } from "@/features/employees/CertificationSection";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const profile = await db.profile.findUnique({ where: { id: params.id } });
  return { title: profile ? `${profile.fullName} – Truls HR` : "Ansattprofil – Truls HR" };
}

export default async function AnsattDetaljPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  const isHrAdmin = viewer?.role === "ADMIN" || viewer?.role === "HR";
  const isOwnProfile = viewer?.id === params.id;

  if (!isHrAdmin && !isOwnProfile) redirect("/ingen-tilgang");

  const [profile, enrollments, documents, assignments, latestHandbook] = await Promise.all([
    db.profile.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { name: true } },
        manager: { select: { id: true, fullName: true, email: true } },
      },
    }),
    db.trainingRecord.findMany({
      where: { profileId: params.id },
      include: { course: { select: { id: true, name: true } } },
      orderBy: { completedAt: "desc" },
    }),
    db.document.findMany({
      where: { visibility: "PUBLIC" },
      select: {
        id: true, title: true, category: true, version: true,
        readConfirmations: { where: { profileId: params.id }, select: { id: true } },
      },
      orderBy: { title: "asc" },
      take: 20,
    }),
    db.profileAssignment.findMany({
      where: { profileId: params.id, endDate: null },
      include: {
        location: { select: { id: true, name: true, city: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
    }),
    db.handbookVersion.findFirst({
      orderBy: { version: "desc" },
      include: { acknowledgements: { where: { profileId: params.id }, select: { id: true } } },
    }),
  ]);

  if (!profile) notFound();

  const onboardingStatus = {
    invited: profile.invitedAt !== null,
    contractSigned: profile.contractSignedAt !== null,
    selfDeclaration: profile.selfDeclarationAt !== null,
    handbookRead: latestHandbook ? latestHandbook.acknowledgements.length > 0 : false,
    isSelfEmployed: profile.employmentType === "SELF_EMPLOYED",
  };

  const courses = enrollments.map((e) => ({
    id: e.id,
    title: e.course.name,
    completedAt: e.completedAt ?? null,
    expiresAt: e.expiresAt ?? null,
  }));

  const docs = documents.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    version: d.version,
    confirmed: d.readConfirmations.length > 0,
  }));

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={isHrAdmin ? "/ansatte" : "/dashboard"}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
        </Link>
      </Button>

      {isHrAdmin && <OnboardingChecklist status={onboardingStatus} />}

      <ProfileTabs
        profileId={profile.id}
        fullName={profile.fullName}
        email={profile.email}
        phone={profile.phone}
        title={profile.title}
        avatarUrl={profile.avatarUrl}
        role={profile.role}
        status={profile.status}
        employmentType={profile.employmentType}
        employeeNumber={profile.employeeNumber}
        department={profile.department}
        manager={profile.manager}
        employedAt={profile.employedAt}
        terminatedAt={profile.terminatedAt}
        courses={courses}
        documents={docs}
        assignments={assignments.map((a) => ({
          id: a.id,
          isPrimary: a.isPrimary,
          roleLabel: a.roleLabel,
          location: a.location,
          department: a.department,
        }))}
        canEdit={isHrAdmin}
        editHref={`/ansatte/${profile.id}/rediger`}
      />

      <CertificationSection profileId={profile.id} canEdit={isHrAdmin} />
    </div>
  );
}
