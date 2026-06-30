import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { buildCsv } from "@/lib/reports/csv";
import { csvExportLimit } from "@/lib/security/rateLimit";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator", HR: "HR", MANAGER: "Leder", EMPLOYEE: "Ansatt",
};

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true },
  });
  if (!profile || !["ADMIN", "HR", "MANAGER"].includes(profile.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const rate = csvExportLimit(profile.id);
  if (!rate.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
    });
  }

  const format = new URL(req.url).searchParams.get("format") ?? "csv";

  const profiles = await db.profile.findMany({
    where: { status: "ACTIVE" },
    select: {
      fullName: true,
      title: true,
      role: true,
      employmentType: true,
      department: { select: { name: true } },
      profileAssignments: {
        where: { isPrimary: true, endDate: null },
        select: { location: { select: { name: true, city: true } } },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  const headers = ["Lokasjon", "Navn", "Stilling", "Avdeling", "Tilknytning", "Rolle"];

  const rows = profiles
    .map((p) => {
      const loc = p.profileAssignments[0]?.location;
      return [
        loc ? (loc.city ?? loc.name) : "Uten lokasjon",
        p.fullName,
        p.title ?? "",
        p.department?.name ?? "",
        p.employmentType === "SELF_EMPLOYED" ? "Selvstendig næringsdrivende" : "Ansatt",
        ROLE_LABEL[p.role] ?? p.role,
      ];
    })
    .sort((a, b) => a[0].localeCompare(b[0], "nb") || a[1].localeCompare(b[1], "nb"));

  await db.auditLog.create({
    data: {
      entityType: "Report",
      entityId: "who-works-where",
      action: "REPORT_EXPORTED",
      actorId: profile.id,
      metadata: { type: "who-works-where", rows: rows.length },
    },
  });

  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return Response.json(
      { headers, rows, generatedAt: date, count: rows.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const csv = buildCsv(headers, rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hvem-jobber-hvor-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
