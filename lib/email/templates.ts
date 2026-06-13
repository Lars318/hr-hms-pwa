const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function buttonHtml(href: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr>
        <td style="background:#2563eb;border-radius:6px">
          <a href="${href}" style="display:inline-block;padding:12px 24px;color:#fff;font-weight:600;font-size:14px;text-decoration:none;font-family:sans-serif">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

export interface NotificationEmailData {
  title: string;
  message: string;
  linkUrl?: string | null;
  recipientName?: string;
}

export function buildNotificationEmail(data: NotificationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { title, message, linkUrl, recipientName } = data;

  const absoluteLink = linkUrl
    ? linkUrl.startsWith("http")
      ? linkUrl
      : `${APP_URL}${linkUrl}`
    : null;

  const greeting = recipientName ? `Hei ${recipientName},` : "Hei,";

  const html = `<!DOCTYPE html>
<html lang="nb">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:20px 32px">
              <span style="color:#fff;font-size:18px;font-weight:700;font-family:sans-serif">HR / HMS</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px">
              <p style="margin:0 0 8px;color:#374151;font-size:14px">${greeting}</p>
              <h1 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;line-height:1.3">${title}</h1>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">${message}</p>
              ${absoluteLink ? buttonHtml(absoluteLink, "Åpne i appen →") : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f1f5f9">
              <p style="margin:0;color:#9ca3af;font-size:12px">
                Dette er et automatisk varsel fra HR/HMS-systemet. Ikke svar på denne e-posten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    "",
    title,
    "",
    message,
    ...(absoluteLink ? ["", `Les mer: ${absoluteLink}`] : []),
    "",
    "---",
    "Dette er et automatisk varsel fra HR/HMS-systemet.",
  ].join("\n");

  return { subject: title, html, text };
}
