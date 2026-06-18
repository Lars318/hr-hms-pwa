import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToProfile } from "@/lib/push/sendPushNotification";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Find all managers and HR/admins
  const leaders = await db.profile.findMany({
    where: { status: "ACTIVE", role: { in: ["MANAGER", "HR", "ADMIN"] } },
    select: { id: true, role: true, departmentId: true },
  });

  let sent = 0;

  for (const leader of leaders) {
    const isHrAdmin = leader.role === "HR" || leader.role === "ADMIN";

    // Absent today
    const absentToday = await db.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
        ...(isHrAdmin ? {} : leader.departmentId ? { departmentId: leader.departmentId } : { id: { in: [] } }),
      },
      include: { employee: { select: { fullName: true } } },
    });

    // Pending approvals
    const pendingLeave = await db.leaveRequest.count({
      where: {
        status: "PENDING",
        ...(isHrAdmin ? {} : leader.departmentId ? { departmentId: leader.departmentId } : { id: { in: [] } }),
      },
    });

    const pendingOvertime = await db.overtimeEntry.count({
      where: {
        status: "SUBMITTED",
        ...(isHrAdmin ? {} : leader.departmentId ? { employee: { departmentId: leader.departmentId } } : { id: { in: [] } }),
      },
    });

    // Only send if there's something to report
    if (absentToday.length === 0 && pendingLeave === 0 && pendingOvertime === 0) continue;

    const lines: string[] = [];

    if (absentToday.length > 0) {
      const names = absentToday.map((l) => l.employee.fullName).join(", ");
      lines.push(`Borte i dag: ${names}`);
    }
    if (pendingLeave > 0) {
      lines.push(`${pendingLeave} fraværssøknad${pendingLeave > 1 ? "er" : ""} venter godkjenning`);
    }
    if (pendingOvertime > 0) {
      lines.push(`${pendingOvertime} overtidsregistrering${pendingOvertime > 1 ? "er" : ""} venter`);
    }

    const dateStr = format(now, "EEEE d. MMMM", { locale: nb });
    await sendPushToProfile(db, leader.id, {
      title: `Morgenbriefing · ${dateStr}`,
      body: lines.join(" · "),
      url: "/dashboard",
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
