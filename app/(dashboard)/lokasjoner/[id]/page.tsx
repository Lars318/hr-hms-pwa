import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Shield, ShieldAlert, Users, Briefcase, Pencil, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
const SEVERITY_LABELS: Record<string, string> = { LOW: "Lav", MEDIUM: "Middels", HIGH: "Høy", CRITICAL: "Kritisk" };
const SEVERITY_COLORS: Record<string, string> = { LOW: "bg-green-500", MEDIUM: "bg-yellow-500", HIGH: "bg-orange-500", CRITICAL: "bg-red-500" };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const loc = await db.location.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: loc ? `${loc.name} – HR/HMS` : "Lokasjon – HR/HMS" };
}

export default async function LokasjonDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  const location = await db.location.findUnique({
    where: { id: params.id },
    include: {
      safetyRepresentative: { select: { id: true, fullName: true, email: true } },
      hseManager: { select: { id: true, fullName: true, email: true } },
      profileAssignments: {
        where: { endDate: null },
        include: {
          profile: { select: { id: true, fullName: true, title: true, role: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: [{ isPrimary: "desc" }, { startDate: "asc" }],
        take: 200,
      },
      incidents: {
        where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
        select: { id: true, title: true, severity: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { incidents: true, riskAssessments: true, actions: { where: { status: { notIn: ["DONE", "CANCELLED"] } } }, profileAssignments: true } },
    },
  });

  if (!location) notFound();

  const ROLE_LABELS: Record<string, string> = { EMPLOYEE: "Ansatt", MANAGER: "Leder", HR: "HR", ADMIN: "Admin" };
  const STATUS_LABELS: Record<string, string> = { OPEN: "Åpen", IN_PROGRESS: "Pågående", RESOLVED: "Løst", CLOSED: "Lukket" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{location.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                location.staffed ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                {location.staffed ? "Bemannet" : "Ubemannet"}
              </span>
            </div>
            {location.city && (
              <p className="text-sm text-muted-foreground">
                {location.address ? `${location.address}, ` : ""}{location.city}
              </p>
            )}
          </div>
        </div>
        {isHrAdmin && (
          <Button variant="outline" asChild className="min-h-[44px] shrink-0">
            <Link href={`/lokasjoner/${location.id}/rediger`}>
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Rediger</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Nøkkelpersoner */}
      <div className="rounded-2xl border bg-card divide-y">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nøkkelpersoner</p>
          {!location.staffed && (
            <p className="text-xs text-muted-foreground mt-1">
              Ubemannet lokasjon — verneombud/HMS-ansvarlig er ikke påkrevd.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5 min-h-[56px]">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Verneombud</p>
            <p className="text-sm font-medium">{location.safetyRepresentative?.fullName ?? "Ikke satt"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5 min-h-[56px]">
          <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">HMS-ansvarlig</p>
            <p className="text-sm font-medium">{location.hseManager?.fullName ?? "Ikke satt"}</p>
          </div>
        </div>
      </div>

      {/* Ansatte */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ansatte ({location._count.profileAssignments})
          </h2>
        </div>
        <div className="rounded-2xl border bg-card divide-y">
          {location.profileAssignments.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen tilknyttede ansatte</div>
          ) : (
            location.profileAssignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {a.profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.roleLabel ?? a.profile.title ?? ROLE_LABELS[a.profile.role]}
                    {a.department ? ` · ${a.department.name}` : ""}
                    {a.isPrimary ? " · Primær" : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* HMS-varsling */}
      {isHrAdmin && (
        <div className="rounded-2xl border bg-card divide-y">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HMS-varsling</p>
            <p className="text-xs text-muted-foreground mt-0.5">Disse mottar varsler ved avvik og risikovurderinger på denne lokasjonen</p>
          </div>
          {location.safetyRepresentative ? (
            <div className="flex items-center gap-3 px-4 py-3.5 min-h-[56px]">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Verneombud</p>
                <p className="text-sm font-medium">{location.safetyRepresentative.fullName}</p>
                <p className="text-xs text-muted-foreground">{location.safetyRepresentative.email}</p>
              </div>
            </div>
          ) : null}
          {location.hseManager ? (
            <div className="flex items-center gap-3 px-4 py-3.5 min-h-[56px]">
              <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">HMS-ansvarlig</p>
                <p className="text-sm font-medium">{location.hseManager.fullName}</p>
                <p className="text-xs text-muted-foreground">{location.hseManager.email}</p>
              </div>
            </div>
          ) : null}
          {!location.safetyRepresentative && !location.hseManager && (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              Ingen verneombud eller HMS-ansvarlig satt – varsler går til HR/Admin.
            </div>
          )}
        </div>
      )}

      {/* Statistikk */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avvik", count: location._count.incidents },
          { label: "Risikovurderinger", count: location._count.riskAssessments },
          { label: "Tiltak", count: location._count.actions },
        ].map(({ label, count }) => (
          <div key={label} className="rounded-2xl border bg-card px-4 py-3 text-center">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Åpne avvik */}
      {location.incidents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Åpne avvik</h2>
            <Link href={`/avvik`} className="text-xs text-primary hover:underline">Se alle →</Link>
          </div>
          <div className="rounded-2xl border bg-card divide-y">
            {location.incidents.map((inc) => (
              <Link
                key={inc.id}
                href={`/avvik/${inc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[52px]"
              >
                <div className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS] ?? "bg-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {SEVERITY_LABELS[inc.severity as keyof typeof SEVERITY_LABELS]} · {STATUS_LABELS[inc.status] ?? inc.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
