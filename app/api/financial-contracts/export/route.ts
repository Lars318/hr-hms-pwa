import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { buildCsv, fmtDate } from "@/lib/reports/csv";
import { csvExportLimit } from "@/lib/security/rateLimit";
import { TYPE_LABELS, STATUS_LABELS } from "@/features/financial-contracts/labels";

export async function GET(req: Request) {
  // Auth — kun ADMIN (Økonomi er admin-only).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true },
  });
  if (!profile || profile.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  // Rate limiting (gjenbruker eksport-grensen).
  const rate = csvExportLimit(profile.id);
  if (!rate.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
    });
  }

  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const contracts = await db.financialContract.findMany({
    where:
      year && !isNaN(year)
        ? {
            startDate: {
              gte: new Date(Date.UTC(year, 0, 1)),
              lt: new Date(Date.UTC(year + 1, 0, 1)),
            },
          }
        : undefined,
    include: { location: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  const headers = [
    "Navn",
    "Leverandør",
    "Type",
    "Status",
    "Senter",
    "Startdato",
    "Sluttdato",
    "Oppsigelse (mnd)",
    "Månedlig (NOK)",
    "Årlig (NOK)",
    "Total verdi (NOK)",
    "Areal (m²)",
    "Automatisk fornyelse",
  ];

  const rows = contracts.map((c) => [
    c.name,
    c.supplierName,
    TYPE_LABELS[c.type] ?? c.type,
    STATUS_LABELS[c.status] ?? c.status,
    c.location?.name ?? c.centerName ?? "",
    fmtDate(c.startDate),
    fmtDate(c.endDate),
    c.noticePeriodMonths ?? "",
    c.monthlyAmount ?? "",
    c.annualAmount ?? "",
    c.totalValue ?? "",
    c.areaSqm ?? "",
    c.renewalOption ? "Ja" : "Nei",
  ]);

  await db.auditLog.create({
    data: {
      entityType: "Report",
      entityId: "financial-contracts",
      action: "REPORT_EXPORTED",
      actorId: profile.id,
      metadata: { type: "financial-contracts", year: year ?? null, rows: rows.length },
    },
  });

  const csv = buildCsv(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `okonomikontrakter${year ? `-${year}` : ""}-${date}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
