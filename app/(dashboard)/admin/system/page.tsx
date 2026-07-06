import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";
export const metadata = { title: "Systemstatus – HR/HMS" };

async function getDbStatus() {
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

export default async function SystemPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || profile.role !== "ADMIN") redirect("/ingen-tilgang");

  const [db_status, userCount, pushCount] = await Promise.all([
    getDbStatus(),
    db.profile.count(),
    db.pushSubscription.count({ where: { revokedAt: null } }),
  ]);

  const env = process.env.NODE_ENV ?? "unknown";
  const sentryEnv = process.env.SENTRY_ENVIRONMENT ?? env;
  const appUrl = process.env.APP_URL ?? "–";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Systemstatus</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Driftsoversikt — kun synlig for administratorer
        </p>
      </div>

      {/* App info */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Applikasjon</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Versjon</dt>
          <dd className="font-mono">{packageJson.version}</dd>

          <dt className="text-muted-foreground">Miljø</dt>
          <dd>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              env === "production"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {env}
            </span>
          </dd>

          <dt className="text-muted-foreground">Sentry-miljø</dt>
          <dd className="font-mono text-xs">{sentryEnv}</dd>

          <dt className="text-muted-foreground">App URL</dt>
          <dd className="font-mono text-xs truncate">{appUrl}</dd>
        </dl>
      </section>

      {/* Database */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Database</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              db_status.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${db_status.ok ? "bg-green-600" : "bg-red-600"}`} />
              {db_status.ok ? "OK" : "Feil"}
            </span>
          </dd>

          <dt className="text-muted-foreground">Latens</dt>
          <dd className="font-mono text-xs">
            {db_status.latencyMs !== null ? `${db_status.latencyMs} ms` : "–"}
          </dd>
        </dl>
      </section>

      {/* Brukere og push */}
      <section className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Brukere og varsler</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Totalt antall brukere</dt>
          <dd className="font-medium">{userCount}</dd>

          <dt className="text-muted-foreground">Aktive push-abonnementer</dt>
          <dd className="font-medium">{pushCount}</dd>
        </dl>
      </section>

      {/* Go-live-sjekkliste */}
      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Go-live-sjekkliste</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Viser kun <em>om</em> en nøkkel er satt — aldri selve verdien.
          </p>
        </div>

        <ReadinessGroup
          title="E-postinvitasjoner og varsler"
          items={[
            { label: "EMAIL_NOTIFICATIONS_ENABLED", ok: process.env.EMAIL_NOTIFICATIONS_ENABLED === "true" },
            { label: "RESEND_API_KEY", ok: !!process.env.RESEND_API_KEY },
            { label: "EMAIL_FROM (verifisert avsender)", ok: !!process.env.EMAIL_FROM },
          ]}
        />

        <ReadinessGroup
          title="Push-varsler"
          items={[
            { label: "PUSH_NOTIFICATIONS_ENABLED", ok: process.env.PUSH_NOTIFICATIONS_ENABLED === "true" },
            { label: "VAPID_PUBLIC_KEY", ok: !!(process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) },
            { label: "VAPID_PRIVATE_KEY", ok: !!process.env.VAPID_PRIVATE_KEY },
            { label: "NEXT_PUBLIC_VAPID_PUBLIC_KEY (klient)", ok: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY },
          ]}
        />

        <ReadinessGroup
          title="AI (kontraktslesing og assistent)"
          items={[
            { label: "OPENAI_API_KEY", ok: !!process.env.OPENAI_API_KEY },
            { label: "FINANCIAL_CONTRACT_AI_ENABLED", ok: process.env.FINANCIAL_CONTRACT_AI_ENABLED === "true" },
            { label: "ASSISTANT_ENABLED", ok: process.env.ASSISTANT_ENABLED === "true" },
          ]}
        />

        <ReadinessGroup
          title="Sikkerhet"
          items={[
            {
              label: "Testbruker-bytter AV i produksjon",
              ok: !(env === "production" && process.env.ENABLE_TEST_SWITCHER === "true"),
              warn: env === "production" && process.env.ENABLE_TEST_SWITCHER === "true",
            },
            { label: "CRON_SECRET satt", ok: !!process.env.CRON_SECRET },
            { label: "Sentry (feilovervåking)", ok: !!process.env.SENTRY_DSN },
          ]}
        />
      </section>

      {/* Helsesjekk-lenke */}
      <p className="text-xs text-muted-foreground">
        Maskinlesbar helsesjekk:{" "}
        <a href="/api/health" target="_blank" className="underline font-mono">
          /api/health
        </a>
      </p>
    </div>
  );
}

type ReadinessItem = { label: string; ok: boolean; warn?: boolean };

function ReadinessGroup({ title, items }: { title: string; items: ReadinessItem[] }) {
  const allOk = items.every((i) => i.ok);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${allOk ? "bg-green-500" : "bg-yellow-500"}`} />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <ul className="space-y-1 pl-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                item.warn ? "bg-red-500" : item.ok ? "bg-green-500" : "bg-gray-300"
              }`}
              aria-hidden
            >
              {item.warn ? "!" : item.ok ? "✓" : "–"}
            </span>
            <span className={`font-mono text-xs ${item.ok ? "" : "text-muted-foreground"}`}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
