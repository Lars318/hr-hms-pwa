import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { CaseDetailClient } from "@/features/whistleblowing/CaseDetailClient";

export const metadata = { title: "Varslingssak – HR/HMS" };

interface Props {
  params: { id: string };
}

export default async function VarslingSakPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  // Hent saksbehandlere (HR + ADMIN) for tildeling
  const assignableProfiles =
    profile.role === "HR" || profile.role === "ADMIN"
      ? await db.profile.findMany({
          where: { role: { in: ["HR", "ADMIN", "MANAGER"] }, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : [];

  const backHref =
    profile.role === "EMPLOYEE"
      ? "/varsling/mine"
      : profile.role === "MANAGER"
      ? "/varsling/admin"
      : "/varsling/admin";

  return (
    <div className="space-y-4 max-w-2xl">
      <Link href={backHref} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Tilbake
      </Link>
      <CaseDetailClient
        caseId={params.id}
        viewerRole={profile.role}
        viewerId={profile.id}
        assignableProfiles={assignableProfiles}
      />
    </div>
  );
}
