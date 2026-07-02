import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ReportExportButtons } from "@/features/reports/ReportExportButtons";

export const metadata = { title: "Hvem jobber hvor – Truls HR" };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator", HR: "HR", MANAGER: "Leder", EMPLOYEE: "Ansatt",
};

export default async function HvemJobberHvorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (!["ADMIN", "HR", "MANAGER"].includes(profile.role)) redirect("/ingen-tilgang");

  const profiles = await db.profile.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true, fullName: true, title: true, role: true, employmentType: true,
      department: { select: { name: true } },
      profileAssignments: {
        where: { isPrimary: true, endDate: null },
        select: { location: { select: { id: true, name: true, city: true } } },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  // Grupper per lokasjon.
  const groups = new Map<string, { name: string; people: typeof profiles }>();
  for (const p of profiles) {
    const loc = p.profileAssignments[0]?.location;
    const key = loc?.id ?? "__none__";
    const name = loc ? (loc.city ?? loc.name) : "Uten lokasjon";
    if (!groups.has(key)) groups.set(key, { name, people: [] });
    groups.get(key)!.people.push(p);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (a.name === "Uten lokasjon") return 1;
    if (b.name === "Uten lokasjon") return -1;
    return a.name.localeCompare(b.name, "nb");
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/rapporter" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hvem jobber hvor</h1>
            <p className="text-sm text-muted-foreground">Ansatte og selvstendige per lokasjon og avdeling</p>
          </div>
        </div>
        <ReportExportButtons
          endpoint="/api/reports/who-works-where"
          title="Hvem jobber hvor"
          fileBase="hvem-jobber-hvor"
        />
      </div>

      {sortedGroups.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-1">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-medium">Ingen ansatte å vise ennå</p>
          <p className="text-sm text-muted-foreground">
            Importer eller opprett ansatte, og knytt dem til en lokasjon — så dukker de opp her.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {sortedGroups.map((g) => (
          <div key={g.name} className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <h2 className="font-semibold text-sm">{g.name}</h2>
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {g.people.length}
              </span>
            </div>
            <ul className="divide-y">
              {g.people.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {p.fullName}
                      {p.employmentType === "SELF_EMPLOYED" && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[10px] font-medium align-middle">
                          Selvstendig
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[p.title, p.department?.name].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                    {ROLE_LABEL[p.role] ?? p.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
