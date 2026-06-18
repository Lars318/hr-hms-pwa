import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToProfile } from "@/lib/push/sendPushNotification";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Find egenmeldinger som startet i går eller i forgårs og slutter i dag eller tidligere
  // = ansatt som ble syk for 1-2 dager siden og ikke har forlenget
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const active = await db.leaveRequest.findMany({
    where: {
      type: "EGENMELDING",
      status: "APPROVED",
      startDate: { gte: twoDaysAgo, lte: yesterday },
      endDate: { gte: todayStart },
    },
    include: { employee: { select: { id: true, fullName: true } } },
  });

  let sent = 0;

  for (const req of active) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "EGENMELDING_EXTEND", entityId: req.id, year } },
    });
    if (already) continue;

    const dayNumber = Math.round(
      (todayStart.getTime() - new Date(req.startDate).setHours(0, 0, 0, 0)) / 86_400_000
    ) + 1;

    // Kun dag 2 og 3
    if (dayNumber < 2 || dayNumber > 3) continue;

    await db.notification.create({
      data: {
        recipientId: req.employeeId,
        type: "SYSTEM",
        title: `Er du fortsatt syk? (dag ${dayNumber})`,
        message: "Trykk for å forlenge egenmeldingen din til og med i dag.",
        linkUrl: `/fravaer/${req.id}`,
      },
    });

    await sendPushToProfile(db, req.employeeId, {
      title: `Er du fortsatt syk? (dag ${dayNumber})`,
      body: "Trykk her for å forlenge egenmeldingen til og med i dag.",
      url: `/fravaer/${req.id}`,
    });

    await db.sentAlert.create({
      data: { type: "EGENMELDING_EXTEND", entityId: req.id, year },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
