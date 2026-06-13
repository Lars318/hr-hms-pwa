import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { buildCsv } from "@/lib/reports/csv";
import { runReport } from "@/lib/reports/queries";
import type { ReportType } from "@/lib/reports/queries";
import { csvExportLimit } from "@/lib/security/rateLimit";

const REPORT_TYPES: ReportType[] = ["incidents", "actions", "risk", "documents", "leave", "handbook", "overtime"];

const FILE_NAMES: Record<ReportType, string> = {
  incidents: "avvik",
  actions: "tiltak",
  risk: "risiko",
  documents: "dokumentlesing",
  leave: "fravaer",
  handbook: "personalhandbok-lesing",
  overtime: "overtid",
};

export async function GET(req: Request) {
  // Auth
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    include: { department: true },
  });
  if (!profile) return new Response("Forbidden", { status: 403 });
  if (profile.role === "EMPLOYEE") return new Response("Forbidden", { status: 403 });

  // Rate limiting
  const rateCheck = csvExportLimit(profile.id);
  if (!rateCheck.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      },
    });
  }

  // Parse params
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as ReportType | null;

  if (!type || !REPORT_TYPES.includes(type)) {
    return new Response("Invalid report type", { status: 400 });
  }

  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const departmentId = url.searchParams.get("departmentId") ?? undefined;

  const { headers, rows, total } = await runReport(type, db, profile, {
    from,
    to,
    departmentId,
  });

  // Audit log: track who exported what data
  await db.auditLog.create({
    data: {
      entityType: "Report",
      entityId: type,
      action: "REPORT_EXPORTED",
      actorId: profile.id,
      metadata: { type, from: from ?? null, to: to ?? null, departmentId: departmentId ?? null, rows: total },
    },
  });

  const csv = buildCsv(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${FILE_NAMES[type]}-${date}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Prevent caching of sensitive export data
      "Cache-Control": "no-store",
    },
  });
}
