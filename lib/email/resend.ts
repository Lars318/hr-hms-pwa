import { Resend } from "resend";

// Lazy singleton — instantiated only when a send is attempted
let _client: Resend | null = null;

function getClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _client = new Resend(key);
  }
  return _client;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === "true";

  if (!enabled) {
    console.log(
      `[email:dev] Would send to ${opts.to} — "${opts.subject}" (EMAIL_NOTIFICATIONS_ENABLED=false)`
    );
    return;
  }

  const from = process.env.EMAIL_FROM ?? "HR/HMS <no-reply@example.com>";
  const client = getClient();

  const { error } = await client.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (error) {
    throw new Error(error.message ?? "Resend API error");
  }
}
