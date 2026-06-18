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
  const results = { probation: 0, training: 0, birthday: 0, contract: 0, vernerunde: 0 };

  // ── 1. Prøvetid utløper innen 14 dager ───────────────────────────────────
  const probationWindow = new Date(now);
  probationWindow.setDate(probationWindow.getDate() + 14);

  const probationProfiles = await db.profile.findMany({
    where: { status: "ACTIVE", probationEndsAt: { gte: now, lte: probationWindow } },
    select: { id: true, fullName: true, probationEndsAt: true, managerId: true, departmentId: true },
  });

  for (const p of probationProfiles) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "PROBATION_ENDING", entityId: p.id, year } },
    });
    if (already) continue;

    const daysLeft = Math.ceil((p.probationEndsAt!.getTime() - now.getTime()) / 86_400_000);
    const hrProfiles = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
      select: { id: true },
    });
    for (const hr of hrProfiles) {
      await db.notification.create({
        data: {
          recipientId: hr.id, type: "SYSTEM",
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
    await db.sentAlert.create({ data: { type: "PROBATION_ENDING", entityId: p.id, year } });
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

    const daysLeft = Math.ceil((rec.expiresAt!.getTime() - now.getTime()) / 86_400_000);
    await db.notification.create({
      data: {
        recipientId: rec.profileId, type: "SYSTEM",
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
    await db.sentAlert.create({ data: { type: "TRAINING_EXPIRING", entityId: rec.id, year } });
    results.training++;
  }

  // ── 3. Bursdager i dag ────────────────────────────────────────────────────
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

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
          recipientId: hr.id, type: "SYSTEM",
          title: "Bursdag i dag 🎂",
          message: `${p.fullName} har bursdag i dag!`,
          linkUrl: `/ansatte/${p.id}`,
        },
      });
    }
    await db.sentAlert.create({ data: { type: "BIRTHDAY", entityId: p.id, year } });
    results.birthday++;
  }

  // ── 4. Kontrakter som utløper innen 60 dager ─────────────────────────────
  const contractWindow = new Date(now);
  contractWindow.setDate(contractWindow.getDate() + 60);

  const expiringContracts = await db.contract.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: contractWindow },
    },
    include: {
      employee: { select: { id: true, fullName: true } },
    },
  });

  for (const c of expiringContracts) {
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "CONTRACT_EXPIRING", entityId: c.id, year } },
    });
    if (already) continue;

    const daysLeft = Math.ceil((c.endDate!.getTime() - now.getTime()) / 86_400_000);
    const hrProfiles = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
      select: { id: true },
    });
    for (const hr of hrProfiles) {
      await db.notification.create({
        data: {
          recipientId: hr.id, type: "SYSTEM",
          title: "Kontrakt utløper snart",
          message: `Kontrakten til ${c.employee.fullName} («${c.title}») utløper om ${daysLeft} dag${daysLeft !== 1 ? "er" : ""}.`,
          linkUrl: `/kontrakter`,
        },
      });
      await sendPushToProfile(db, hr.id, {
        title: "Kontrakt utløper snart",
        body: `${c.employee.fullName} – ${daysLeft} dager igjen.`,
        url: `/kontrakter`,
      });
    }
    await db.sentAlert.create({ data: { type: "CONTRACT_EXPIRING", entityId: c.id, year } });
    results.contract++;
  }

  // ── 5. Vernerunde ikke gjennomført inneværende år (varsle i oktober) ──────
  const isOctober = now.getMonth() === 9; // 0-indexed
  if (isOctober) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const completedThisYear = await db.inspectionRecord.count({
      where: { status: "COMPLETED", createdAt: { gte: yearStart, lte: yearEnd } },
    });

    const alertId = `vernerunde-${year}`;
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "VERNERUNDE_MISSING", entityId: alertId, year } },
    });

    if (completedThisYear === 0 && !already) {
      const hmsProfiles = await db.profile.findMany({
        where: { status: "ACTIVE", role: { in: ["ADMIN", "HR"] } },
        select: { id: true },
      });
      for (const p of hmsProfiles) {
        await db.notification.create({
          data: {
            recipientId: p.id, type: "SYSTEM",
            title: "Vernerunde ikke gjennomført",
            message: `Ingen vernerunde er registrert som fullført i ${year}. AML §3-1 krever minst én per år.`,
            linkUrl: `/hms-runde`,
          },
        });
        await sendPushToProfile(db, p.id, {
          title: "Vernerunde mangler",
          body: `Ingen fullført vernerunde registrert i ${year}. Planlegg én nå.`,
          url: `/hms-runde`,
        });
      }
      await db.sentAlert.create({ data: { type: "VERNERUNDE_MISSING", entityId: alertId, year } });
      results.vernerunde++;
    }
  }

  // ── 6. Mars: påminnelse om å søke sommerferie innen utgangen av mars ─────
  // Ferieloven §6: arbeidsgiver skal varsle ferieavvikling 2 måneder i forveien.
  // Vi varsler ansatte i mars slik at de rekker å søke før fristen.
  const isMarch = now.getMonth() === 2; // 0-indexed
  if (isMarch) {
    const activeEmployees = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: { id: true },
    });

    for (const emp of activeEmployees) {
      const already = await db.sentAlert.findUnique({
        where: { type_entityId_year: { type: "SUMMER_VACATION_PLAN_REMINDER", entityId: emp.id, year } },
      });
      if (already) continue;

      await db.notification.create({
        data: {
          recipientId: emp.id, type: "SYSTEM",
          title: "Husk å søke sommerferie",
          message: `Ferieloven §6 krever at sommerferie varsles minst 2 måneder i forveien. Søk om ferie for juni–august innen utgangen av mars.`,
          linkUrl: `/fravaer/ny`,
        },
      });
      await sendPushToProfile(db, emp.id, {
        title: "Husk å søke sommerferie",
        body: "Søk om sommerferie innen utgangen av mars (ferieloven §6).",
        url: `/fravaer/ny`,
      });

      await db.sentAlert.create({ data: { type: "SUMMER_VACATION_PLAN_REMINDER", entityId: emp.id, year } });
      results.vernerunde++; // reuse counter field — rename tracked below
    }
  }

  // ── 7. Mai: ansatte uten godkjent sommerferie (ferieloven §6) ─────────────
  // Sommerferie = juni, juli, august (månedene 5, 6, 7 i 0-indexed)
  const isMay = now.getMonth() === 4;
  if (isMay) {
    const summerStart = new Date(year, 5, 1);  // 1. juni
    const summerEnd   = new Date(year, 7, 31, 23, 59, 59); // 31. august

    const activeEmployees = await db.profile.findMany({
      where: { status: "ACTIVE", role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: { id: true, fullName: true },
    });

    for (const emp of activeEmployees) {
      const already = await db.sentAlert.findUnique({
        where: { type_entityId_year: { type: "SUMMER_VACATION_MISSING", entityId: emp.id, year } },
      });
      if (already) continue;

      const summerVacation = await db.leaveRequest.findFirst({
        where: {
          employeeId: emp.id,
          type: "VACATION",
          status: "APPROVED",
          startDate: { lte: summerEnd },
          endDate: { gte: summerStart },
        },
      });

      if (summerVacation) continue; // allerede planlagt

      await db.notification.create({
        data: {
          recipientId: emp.id, type: "SYSTEM",
          title: "Sommerferie ikke planlagt",
          message: `Du har ingen godkjent ferie registrert for sommeren (juni–august). Ferieloven §6 krever 2 måneders varsel — søk nå.`,
          linkUrl: `/fravaer/ny`,
        },
      });
      await sendPushToProfile(db, emp.id, {
        title: "Sommerferie ikke planlagt",
        body: "Du har ingen godkjent sommerferie. Søk nå — ferieloven krever 2 måneders varsel.",
        url: `/fravaer/ny`,
      });

      await db.sentAlert.create({ data: { type: "SUMMER_VACATION_MISSING", entityId: emp.id, year } });
      results.contract++; // reuse counter field
    }
  }

  return NextResponse.json({ ok: true, sent: results });
}
