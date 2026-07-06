import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { RapporterClient } from "@/features/reports/RapporterClient";

export const metadata = { title: "Rapporter – HR/HMS" };

export default async function RapporterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role === "EMPLOYEE") redirect("/ingen-tilgang");

  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
        <p className="text-sm text-muted-foreground">
          {profile.role === "MANAGER"
            ? "Rapporter for din avdeling."
            : "Rapporter og CSV-eksport for hele organisasjonen."}
        </p>
      </div>

      <Link
        href="/rapporter/hvem-jobber-hvor"
        className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow"
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">Hvem jobber hvor</p>
          <p className="text-xs text-muted-foreground">Ansatte og selvstendige per lokasjon og avdeling · CSV/PDF</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
      </Link>

      {profile.role !== "MANAGER" && (
        <Link
          href="/rapporter/kompetanse"
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Kompetansematrise</p>
            <p className="text-xs text-muted-foreground">Sertifikater og utløpsdatoer per ansatt · førstehjelp, brannvern, PT</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
        </Link>
      )}

      <RapporterClient viewerRole={profile.role} departments={departments} />
    </div>
  );
}
