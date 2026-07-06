import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/invite";

const CRON_SECRET = process.env.CRON_SECRET;

// Antall dager etter invitasjon før første påminnelse, og minimum dager mellom
// påminnelser, slik at vi ikke spammer.
const DAYS_BEFORE_REMINDER = 7;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    return NextResponse.json({ skipped: "EMAIL_NOTIFICATIONS_ENABLED != true" });
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - DAYS_BEFORE_REMINDER);

  // Kandidater: aktive, invitert for > 7 dager siden, og enten aldri påminnet
  // eller sist påminnet for > 7 dager siden.
  const candidates = await db.profile.findMany({
    where: {
      status: "ACTIVE",
      invitedAt: { not: null, lte: cutoff },
      OR: [{ inviteReminderAt: null }, { inviteReminderAt: { lte: cutoff } }],
    },
    select: { id: true, email: true, fullName: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ reminded: 0, checked: 0 });
  }

  // Bygg oppslag e-post → har logget inn (last_sign_in_at) via Supabase admin.
  const admin = createAdminClient();
  const signedInEmails = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    for (const u of data.users) {
      if (u.email && u.last_sign_in_at) signedInEmails.add(u.email.toLowerCase());
    }
    if (data.users.length < 1000) break;
  }

  let reminded = 0;
  const errors: string[] = [];
  for (const p of candidates) {
    // Hopp over de som allerede har logget inn.
    if (signedInEmails.has(p.email.toLowerCase())) continue;
    try {
      await sendInviteEmail(db, p, { isReminder: true });
      await db.profile.update({ where: { id: p.id }, data: { inviteReminderAt: new Date() } });
      reminded++;
    } catch (e) {
      errors.push(`${p.email}: ${e instanceof Error ? e.message : "ukjent feil"}`);
    }
  }

  return NextResponse.json({ reminded, checked: candidates.length, errors });
}
