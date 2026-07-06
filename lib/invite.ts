import type { PrismaClient } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://hr-hms-pwa.vercel.app"
  );
}

/**
 * Sender én invitasjons-/passord-e-post til en ansatt og setter invitedAt.
 * Delt mellom profile.invite-mutasjonen og den automatiske påminnelse-cronen.
 */
export async function sendInviteEmail(
  db: PrismaClient,
  person: { id: string; email: string; fullName: string },
  opts?: { isReminder?: boolean },
): Promise<void> {
  const admin = createAdminClient();
  const appUrl = getAppUrl();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: person.email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/auth/update-password` },
  });
  const link = data?.properties?.action_link;
  if (error || !link) throw new Error(error?.message ?? "Kunne ikke generere lenke.");

  const firstName = person.fullName.split(" ")[0];
  const isReminder = opts?.isReminder ?? false;
  const subject = isReminder
    ? "Påminnelse: sett passordet ditt i Truls HR"
    : "Velkommen til Truls HR — sett passordet ditt";
  const intro = isReminder
    ? `Vi minner om at du har fått tilgang til <strong>Truls HR</strong> — Pulsfollo sin app for HR og HMS, men du har ikke logget inn ennå.`
    : `Du har fått tilgang til <strong>Truls HR</strong> — Pulsfollo sin app for HR og HMS (fravær, avvik, dokumenter og mer).`;

  await sendEmail({
    to: person.email,
    subject,
    text: `Hei ${firstName}!\n\n${isReminder ? "Påminnelse: " : ""}Du har fått tilgang til Truls HR.\n\nSett passordet ditt her:\n${link}\n\nEtter at du har satt passord kan du logge inn på ${appUrl}.\n\nHilsen Pulsfollo`,
    html: `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto">
  <div style="background:#456237;color:#fff;padding:24px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;font-size:20px">${isReminder ? "Påminnelse fra Truls HR" : "Velkommen til Truls HR"}</h1>
  </div>
  <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 16px 16px">
    <p>Hei ${firstName}!</p>
    <p>${intro}</p>
    <p>Trykk på knappen for å sette passordet ditt:</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${link}" style="background:#456237;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;display:inline-block">Sett passord</a>
    </p>
    <p style="font-size:13px;color:#666">Virker ikke knappen? Kopier denne lenken inn i nettleseren:<br><span style="word-break:break-all">${link}</span></p>
    <p style="font-size:13px;color:#666">Etterpå kan du logge inn på <a href="${appUrl}">${appUrl}</a> og installere appen på mobilen.</p>
  </div>
</div>`,
  });

  await db.profile.update({ where: { id: person.id }, data: { invitedAt: new Date() } });
}
