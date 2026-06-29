import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Plus, Users, ShieldAlert, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Lokasjoner – HR/HMS" };

export default async function LokasjonerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isHms = profile.role === "HR" && profile.title?.toLowerCase().includes("hms");
  if (!isHrAdmin && !isHms && profile.role !== "MANAGER") redirect("/dashboard");

  const locations = await db.location.findMany({
    orderBy: { name: "asc" },
    include: {
      safetyRepresentative: { select: { id: true, fullName: true } },
      hseManager: { select: { id: true, fullName: true } },
      _count: {
        select: {
          incidents: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
          profileAssignments: { where: { endDate: null } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lokasjoner</h1>
          <p className="text-sm text-muted-foreground">Treningssentre og arbeidsplasser i organisasjonen.</p>
        </div>
        {isHrAdmin && (
          <Button asChild className="min-h-[44px]">
            <Link href="/lokasjoner/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny lokasjon</span>
            </Link>
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Ingen lokasjoner registrert</p>
          <p className="text-xs text-muted-foreground mt-1">Opprett den første lokasjonen for å komme i gang.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={`/lokasjoner/${loc.id}`}
              className="rounded-2xl border bg-card p-5 hover:bg-accent/30 transition-colors flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                {loc._count.incidents > 0 && (
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    {loc._count.incidents} åpne avvik
                  </span>
                )}
              </div>

              <div>
                <p className="font-semibold">{loc.name}</p>
                {loc.city && <p className="text-sm text-muted-foreground">{loc.address ? `${loc.address}, ` : ""}{loc.city}</p>}
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{loc._count.profileAssignments} ansatte tilknyttet</span>
                </div>
                {loc.safetyRepresentative && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span>VO: {loc.safetyRepresentative.fullName}</span>
                  </div>
                )}
                {loc.hseManager && (
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>HMS: {loc.hseManager.fullName}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
