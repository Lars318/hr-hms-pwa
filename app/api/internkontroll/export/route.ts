import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { buildCsv, fmtDate } from "@/lib/reports/csv";
import { csvExportLimit } from "@/lib/security/rateLimit";
import { differenceInDays } from "date-fns";

const KATEGORI_LABEL: Record<string, string> = {
  BRANNVERN: "Brannvern",
  EL_SIKKERHET: "El-sikkerhet",
  ARBEIDSMILJO: "Arbeidsmiljø",
  KJORETOY: "Kjøretøy",
  STOFFKARTOTEK: "Stoffkartotek",
  ANNET: "Annet",
};

const STATUS_LABEL: Record<string, string> = {
  OK: "OK",
  FORFALLER_SNART: "Forfaller snart",
  FORFALT: "Forfalt",
  IKKE_SATT: "Ikke registrert",
};

function beregnStatus(nesteFrist: Date | null): keyof typeof STATUS_LABEL {
  if (!nesteFrist) return "IKKE_SATT";
  const dager = differenceInDays(nesteFrist, new Date());
  if (dager < 0) return "FORFALT";
  if (dager <= 30) return "FORFALLER_SNART";
  return "OK";
}

export async function GET(req: Request) {
  // Auth — kun HMS-ansvarlige (ADMIN/HR/MANAGER), for revisjon/tilsyn.
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

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";

  const omrader = await db.internkontrollOmrade.findMany({
    include: {
      ansvarlig: { select: { fullName: true } },
      logg: {
        orderBy: { utfortDato: "desc" },
        take: 1,
        include: { utfortAv: { select: { fullName: true } } },
      },
    },
    orderBy: [{ kategori: "asc" }, { tittel: "asc" }],
  });

  const headers = [
    "Kategori",
    "Tittel",
    "Ansvarlig",
    "Intervall (dager)",
    "Siste kontroll",
    "Utført av",
    "Resultat",
    "Neste frist",
    "Status",
  ];

  const rows = omrader.map((o) => {
    const siste = o.logg[0];
    const status = beregnStatus(siste?.nesteFrist ?? null);
    return [
      KATEGORI_LABEL[o.kategori] ?? o.kategori,
      o.tittel,
      o.ansvarlig?.fullName ?? "",
      o.intervalDager,
      siste ? fmtDate(siste.utfortDato) : "",
      siste?.utfortAv.fullName ?? "",
      siste ? (siste.godkjent ? "Godkjent" : "Avvik") : "",
      siste ? fmtDate(siste.nesteFrist) : "",
      STATUS_LABEL[status],
    ];
  });

  await db.auditLog.create({
    data: {
      entityType: "Report",
      entityId: "internkontroll",
      action: "REPORT_EXPORTED",
      actorId: profile.id,
      metadata: { type: "internkontroll", rows: rows.length },
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
      "Content-Disposition": `attachment; filename="internkontroll-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
