import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "./resend";
import { buildNotificationEmail } from "./templates";

interface SendNotificationEmailInput {
  db: PrismaClient;
  notificationId: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  linkUrl?: string | null;
}

/**
 * Send an e-mail for a single Notification row.
 * Updates emailSentAt on success, emailError on failure.
 * Never throws — email failures must not break the main request flow.
 */
export async function sendNotificationEmail({
  db,
  notificationId,
  recipientEmail,
  recipientName,
  title,
  message,
  linkUrl,
}: SendNotificationEmailInput): Promise<void> {
  if (!recipientEmail) return;

  const { subject, html, text } = buildNotificationEmail({
    title,
    message,
    linkUrl,
    recipientName,
  });

  try {
    await sendEmail({ to: recipientEmail, subject, html, text });
    await db.notification.update({
      where: { id: notificationId },
      data: { emailSentAt: new Date(), emailError: null },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed to send to ${recipientEmail}: ${errorMsg}`);
    await db.notification
      .update({
        where: { id: notificationId },
        data: { emailError: errorMsg.slice(0, 500) },
      })
      .catch(() => {
        // Swallow DB error to avoid cascading failures
      });
  }
}
