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
  const results = { probation: 0, training: 0, birthday: 0 };

  // ── 1. Prøvetid utløper innen 14 dager ───────────────────────────────────
  const probationWindow = new Date(now);
  probationWindow.setDate(probationWindow.getDate() + 14);

  const probationProfiles = await db.profile.findMany({
    where: {
      status: "ACTIVE",
      probationEndsAt: { gte: now, lte: probationWindow },
    },
    select: { id: true, fullName: true, probationEndsAt: true, managerId: true, departmentId: true },
  });

  for (const p of probationProfiles) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "PROBATION_ENDING", entityId: p.id, year } },
    });
    if (already) continue;

    const daysLeft = Math.ceil(
      (p.probationEndsAt!.getTime() - now.getTime()) / 86_400_000
    );

    // Notify HR/Admin
    const hrProfiles = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
      select: { id: true },
    });
    for (const hr of hrProfiles) {
      await db.notification.create({
        data: {
          recipientId: hr.id,
          type: "SYSTEM",
          title: "Prøvetid utløper snart",
          message: `${p.fullName} sin prøvetid utløper om ${daysLeft} dag${daysLeft !== 1 ? "er" : ""}.`,
          linkUrl: `/ansatte/${p.id}`,
        },
      });
      await sendPushToProfile(db, hr.id, {
        title: "Prøvetid utløper snart",
        body: `${p.fullName} sin prøvetid utløper om ${daysLeft} dager.`,
        url: `/ansatte/${p.id}`,
      });
    }

    await db.sentAlert.create({
      data: { type: "PROBATION_ENDING", entityId: p.id, year },
    });
    results.probation++;
  }

  // ── 2. Kurssertifikat utløper innen 30 dager ─────────────────────────────
  const certWindow = new Date(now);
  certWindow.setDate(certWindow.getDate() + 30);

  const expiringRecords = await db.trainingRecord.findMany({
    where: { expiresAt: { gte: now, lte: certWindow } },
    include: {
      profile: { select: { id: true, fullName: true } },
      course: { select: { name: true } },
    },
  });

  for (const rec of expiringRecords) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "TRAINING_EXPIRING", entityId: rec.id, year } },
    });
    if (already) continue;

    const daysLeft = Math.ceil(
      (rec.expiresAt!.getTime() - now.getTime()) / 86_400_000
    );

    // Notify the employee
    await db.notification.create({
      data: {
        recipientId: rec.profileId,
        type: "SYSTEM",
        title: "Kurssertifikat utløper snart",
        message: `Sertifikatet for "${rec.course.name}" utløper om ${daysLeft} dag${daysLeft !== 1 ? "er" : ""}.`,
        linkUrl: `/opplaering`,
      },
    });
    await sendPushToProfile(db, rec.profileId, {
      title: "Kurssertifikat utløper",
      body: `"${rec.course.name}" utløper om ${daysLeft} dager.`,
      url: `/opplaering`,
    });

    await db.sentAlert.create({
      data: { type: "TRAINING_EXPIRING", entityId: rec.id, year },
    });
    results.training++;
  }

  // ── 3. Bursdager i dag ────────────────────────────────────────────────────
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  // Fetch all active profiles with dateOfBirth, filter in JS (month/day match)
  const allWithBirthday = await db.profile.findMany({
    where: { status: "ACTIVE", dateOfBirth: { not: null } },
    select: { id: true, fullName: true, dateOfBirth: true },
  });

  const birthdayProfiles = allWithBirthday.filter((p) => {
    const dob = p.dateOfBirth!;
    return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
  });

  for (const p of birthdayProfiles) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "BIRTHDAY", entityId: p.id, year } },
    });
    if (already) continue;

    const hrProfiles = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
      select: { id: true },
    });
    for (const hr of hrProfiles) {
      await db.notification.create({
        data: {
          recipientId: hr.id,
          type: "SYSTEM",
          title: "Bursdag i dag 🎂",
          message: `${p.fullName} har bursdag i dag!`,
          linkUrl: `/ansatte/${p.id}`,
        },
      });
    }

    await db.sentAlert.create({
      data: { type: "BIRTHDAY", entityId: p.id, year },
    });
    results.birthday++;
  }

  return NextResponse.json({ ok: true, sent: results });
}
