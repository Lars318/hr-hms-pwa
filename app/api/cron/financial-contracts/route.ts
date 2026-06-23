import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToProfile } from "@/lib/push/sendPushNotification";
import type { AlertType } from "@prisma/client";

const CRON_SECRET = process.env.CRON_SECRET;

const DAY_MS = 86_400_000;
const EXPIRES_SOON_DAYS = 90; // ACTIVE → EXPIRES_SOON-vindu
const NOTICE_ALERT_DAYS = 30; // varsle når oppsigelsesfrist er innen 30 dager

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / DAY_MS);
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

function nok(v: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(v);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const results = {
    statusToExpiresSoon: 0,
    statusToExpired: 0,
    statusToActive: 0,
    noticeAlerts: 0,
    expiryPush: 0,
    digestSent: 0,
  };

  // Admin-mottakere (gjenbrukes gjennom hele jobben)
  const admins = await db.profile.findMany({
    where: { status: "ACTIVE", role: "ADMIN" },
    select: { id: true },
  });

  // ── 1. Automatisk statusoppdatering ───────────────────────────────────────
  // Kun automatiske statuser berøres. DRAFT og TERMINATED settes manuelt og
  // røres aldri av cron-jobben.
  const autoContracts = await db.financialContract.findMany({
    where: { status: { in: ["ACTIVE", "EXPIRES_SOON", "EXPIRED"] }, endDate: { not: null } },
    select: { id: true, status: true, endDate: true },
  });

  const soonThreshold = new Date(now.getTime() + EXPIRES_SOON_DAYS * DAY_MS);

  for (const c of autoContracts) {
    const end = c.endDate!;
    let next = c.status;
    if (end < now) next = "EXPIRED";
    else if (end <= soonThreshold) next = "EXPIRES_SOON";
    else next = "ACTIVE";

    if (next === c.status) continue;

    await db.financialContract.update({ where: { id: c.id }, data: { status: next } });
    if (next === "EXPIRES_SOON") results.statusToExpiresSoon++;
    else if (next === "EXPIRED") results.statusToExpired++;
    else results.statusToActive++;
  }

  // ── 2. Oppsigelsesfrist-varsel ────────────────────────────────────────────
  // Frist = endDate − noticePeriodMonths. Varsle ADMIN når fristen nærmer seg,
  // slik at man rekker å si opp før automatisk fornyelse.
  const noticeContracts = await db.financialContract.findMany({
    where: {
      status: { in: ["ACTIVE", "EXPIRES_SOON"] },
      endDate: { not: null },
      noticePeriodMonths: { not: null, gt: 0 },
    },
    select: { id: true, name: true, supplierName: true, endDate: true, noticePeriodMonths: true },
  });

  for (const c of noticeContracts) {
    const deadline = new Date(c.endDate!);
    deadline.setMonth(deadline.getMonth() - c.noticePeriodMonths!);

    const daysToDeadline = daysBetween(deadline, now);
    if (daysToDeadline < 0 || daysToDeadline > NOTICE_ALERT_DAYS) continue;

    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "FINANCIAL_CONTRACT_NOTICE", entityId: c.id, year } },
    });
    if (already) continue;

    const deadlineStr = deadline.toLocaleDateString("nb-NO");
    for (const a of admins) {
      await db.notification.create({
        data: {
          recipientId: a.id,
          type: "SYSTEM",
          title: "Oppsigelsesfrist nærmer seg",
          message: `«${c.name}» (${c.supplierName}): oppsigelsesfristen er ${deadlineStr} (om ${daysToDeadline} dag${daysToDeadline !== 1 ? "er" : ""}). Si opp nå for å unngå automatisk fornyelse.`,
          linkUrl: `/okonomi/kontrakter`,
        },
      });
      await sendPushToProfile(db, a.id, {
        title: "Oppsigelsesfrist nærmer seg",
        body: `«${c.name}» – frist ${deadlineStr} (${daysToDeadline} dager igjen).`,
        url: `/okonomi/kontrakter`,
      });
    }
    await db.sentAlert.create({
      data: { type: "FINANCIAL_CONTRACT_NOTICE", entityId: c.id, year },
    });
    results.noticeAlerts++;
  }

  // ── 3. Utløpsvarsel 30/60/90 dager til ADMIN ──────────────────────────────
  const THRESHOLDS: { days: number; type: AlertType }[] = [
    { days: 90, type: "FINANCIAL_CONTRACT_EXP_90" },
    { days: 60, type: "FINANCIAL_CONTRACT_EXP_60" },
    { days: 30, type: "FINANCIAL_CONTRACT_EXP_30" },
  ];

  const expiringContracts = await db.financialContract.findMany({
    where: {
      status: { in: ["ACTIVE", "EXPIRES_SOON"] },
      endDate: { gte: now, lte: new Date(now.getTime() + 90 * DAY_MS) },
    },
    select: { id: true, name: true, supplierName: true, endDate: true },
  });

  for (const c of expiringContracts) {
    const daysLeft = daysBetween(c.endDate!, now);
    // Velg det minste terskelvinduet kontrakten faller innenfor.
    const threshold = THRESHOLDS.find((t) => daysLeft <= t.days);
    if (!threshold) continue;

    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: threshold.type, entityId: c.id, year } },
    });
    if (already) continue;

    for (const a of admins) {
      await db.notification.create({
        data: {
          recipientId: a.id,
          type: "SYSTEM",
          title: "Kontrakt utløper snart",
          message: `«${c.name}» (${c.supplierName}) utløper om ${daysLeft} dag${daysLeft !== 1 ? "er" : ""} (${c.endDate!.toLocaleDateString("nb-NO")}).`,
          linkUrl: `/okonomi/kontrakter`,
        },
      });
      await sendPushToProfile(db, a.id, {
        title: "Kontrakt utløper snart",
        body: `«${c.name}» – ${daysLeft} dager igjen.`,
        url: `/okonomi/kontrakter`,
      });
    }
    await db.sentAlert.create({ data: { type: threshold.type, entityId: c.id, year } });
    results.expiryPush++;
  }

  // ── 4. Ukentlig digest (kun mandager) ─────────────────────────────────────
  // Oppsummering av kontrakter som utløper neste kvartal + samlet månedskostnad.
  if (now.getDay() === 1) {
    const week = isoWeek(now);
    const digestEntityId = `weekly-${year}-W${week}`;
    const already = await db.sentAlert.findUnique({
      where: { type_entityId_year: { type: "FINANCIAL_CONTRACT_DIGEST", entityId: digestEntityId, year } },
    });

    if (!already) {
      const quarterEnd = new Date(now.getTime() + 90 * DAY_MS);
      const expiringSoon = await db.financialContract.findMany({
        where: {
          status: { in: ["ACTIVE", "EXPIRES_SOON"] },
          endDate: { gte: now, lte: quarterEnd },
        },
        select: { monthlyAmount: true },
      });

      if (expiringSoon.length > 0) {
        const count = expiringSoon.length;
        const totalMonthly = expiringSoon.reduce((sum, c) => sum + (c.monthlyAmount ?? 0), 0);
        const msg = `${count} kontrakt${count !== 1 ? "er" : ""} utløper neste kvartal — samlet månedskostnad ${nok(totalMonthly)}.`;

        for (const a of admins) {
          await db.notification.create({
            data: {
              recipientId: a.id,
              type: "SYSTEM",
              title: "Ukentlig kontraktsoversikt",
              message: msg,
              linkUrl: `/okonomi/kontrakter`,
            },
          });
          await sendPushToProfile(db, a.id, {
            title: "Ukentlig kontraktsoversikt",
            body: msg,
            url: `/okonomi/kontrakter`,
          });
        }
        await db.sentAlert.create({
          data: { type: "FINANCIAL_CONTRACT_DIGEST", entityId: digestEntityId, year },
        });
        results.digestSent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent: results });
}
