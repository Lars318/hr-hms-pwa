import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { CheckCircle2, XCircle, AlertTriangle, Clock, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Compliance-status – HR/HMS" };

const P0_ITEMS = [
  { id: "P0-1", text: "Personvernerklæring for ansatte", done: true, note: "Tilgjengelig på /personvern" },
  { id: "P0-2", text: "Dokumentere behandlingsgrunnlag per kategori", done: false, note: "Se PRIVACY_AND_GDPR.md – krever juridisk gjennomgang" },
  { id: "P0-3", text: "Databehandleravtaler (Supabase, Vercel, Resend, Sentry)", done: false, note: "Må inngås av daglig leder" },
  { id: "P0-4", text: "Dokumentere hvilke personopplysninger behandles", done: true, note: "Se PRIVACY_AND_GDPR.md" },
  { id: "P0-5", text: "Dokumentere tilgangsstyring per rolle og lokasjon", done: true, note: "Se PRIVACY_AND_GDPR.md" },
  { id: "P0-6", text: "Dokumentere lagringstid/retention per datakategori", done: false, note: "Forslag i PRIVACY_AND_GDPR.md – formell policy mangler" },
  { id: "P0-7", text: "Tydelig avgrensning: appen er ikke full arbeidstidsregistrering", done: true, note: "Synlig i overtid-side og /personvern" },
  { id: "P0-8", text: "Dokumentere verneombud og HMS-ansvar per lokasjon", done: true, note: "Implementert i lokasjonsmodulen" },
  { id: "P0-9", text: "Avvik/risiko/tiltak har sporbarhet (audit-logg)", done: true, note: "Audit-logg implementert" },
  { id: "P0-10", text: "Rutine for personvernbrudd (72t-varsling Datatilsynet)", done: true, note: "Utkast: docs/pilot/PERSONAL_DATA_BREACH_PROCEDURE.md – godkjennes av daglig leder" },
  { id: "P0-11", text: "Prosess for innsyn, retting og sletting dokumentert", done: true, note: "Utkast: docs/pilot/DATA_SUBJECT_REQUEST_PROCEDURE.md – gjennomgås av HR" },
];

const P1_ITEMS = [
  { id: "P1-1", text: "Varslingsmodul for kritikkverdige forhold (whistleblowing) ✅ Gjort i 25A – intern modul. Ekstern anonym kanal gjenstår." },
  { id: "P1-2", text: "HMS-opplæringsregister" },
  { id: "P1-3", text: "Stoffkartotek/kjemikalier" },
  { id: "P1-4", text: "Eksport/innsyn for ansattes egne personopplysninger" },
  { id: "P1-5", text: "Lagringstid-admin (retention) for HR" },
  { id: "P1-8", text: "Automatisk fristbrudd-notifikasjon for tiltak" },
  { id: "P1-9", text: "Langtidsfraværsoppfølging (4/8 uker dialogmøte-påminnelse)" },
  { id: "P1-11", text: "Automatisk deaktivering av profil ved avsluttet ansettelse" },
];

export default async function CompliancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  const isHmsRole =
    profile?.role === "ADMIN" ||
    profile?.role === "HR";

  if (!isHmsRole) redirect("/ingen-tilgang");

  const p0Done = P0_ITEMS.filter((i) => i.done).length;
  const p0Total = P0_ITEMS.length;
  const pct = Math.round((p0Done / p0Total) * 100);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance-status</h1>
        <p className="text-muted-foreground mt-1">
          Oversikt over HMS- og GDPR-compliance for HR/HMS-portalen.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sist oppdatert: Juni 2026 · Kun ADMIN/HR
        </p>
      </div>

      {/* P0-status */}
      <section className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">P0 – Pilot-klar status</h2>
          <span className={`text-sm font-bold px-2 py-1 rounded-full ${pct === 100 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {p0Done}/{p0Total} gjennomført ({pct}%)
          </span>
        </div>
        <div className="w-full rounded-full bg-muted h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {P0_ITEMS.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl bg-muted/40 px-3 py-2">
              {item.done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.id}: {item.text}</p>
                {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* P1-liste */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold">P1 – Før bred utrulling</h2>
        </div>
        <div className="space-y-2">
          {P1_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-sm">{item.id}: {item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avgrensninger */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <h2 className="font-semibold text-amber-800">Bevisst utenfor scope</h2>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li><strong>Arbeidstidsregistrering</strong> – håndteres i andre systemer. Appen dekker kun overtid/timebank.</li>
          <li><strong>AMU</strong> – arbeidsmiljøutvalg ikke aktuelt per i dag.</li>
          <li><strong>BHT</strong> – bedriftshelsetjeneste ikke aktuelt per i dag.</li>
        </ul>
      </section>

      {/* Juridisk status */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-red-700">⚠️ Ikke juridisk godkjent</p>
        <p className="text-xs text-red-600">
          Alle pilot-dokumenter under er tekniske og operative utkast. Behandlingsgrunnlag og
          DPA-er MÅ gjennomgås og bekreftes av daglig leder og eventuelt juridisk rådgiver
          før pilot.
        </p>
      </section>

      {/* Pilot-dokumenter */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          <h2 className="font-semibold">Pilot Readiness Pack</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">24C</span>
        </div>
        <div className="grid gap-2 text-sm">
          {[
            { label: "DPA-sjekkliste", path: "docs/pilot/DPA_CHECKLIST.md", desc: "Databehandleravtaler – Supabase, Vercel, Resend, Sentry", done: false },
            { label: "Behandlingsgrunnlagsregister", path: "docs/pilot/PROCESSING_BASIS_REGISTER.md", desc: "Alle behandlinger, grunnlag og lagringstid – MÅ bekreftes juridisk", done: false },
            { label: "Retention policy (utkast)", path: "docs/pilot/RETENTION_POLICY_DRAFT.md", desc: "Lagringstid og sletteprosedyrer per datakategori", done: false },
            { label: "Personvernbrudd-rutine", path: "docs/pilot/PERSONAL_DATA_BREACH_PROCEDURE.md", desc: "72t-varslingsprosess – godkjennes av daglig leder", done: false },
            { label: "Rettighetsforespørsel-prosedyre", path: "docs/pilot/DATA_SUBJECT_REQUEST_PROCEDURE.md", desc: "Innsyn, retting, sletting og eksport", done: false },
            { label: "Pilot Readiness Checklist", path: "docs/pilot/PILOT_READINESS_CHECKLIST.md", desc: "Komplett go/no-go-sjekkliste", done: false },
          ].map(({ label, path, desc, done }) => (
            <div key={path} className="rounded-xl bg-muted/40 px-4 py-3 flex items-start gap-3">
              {done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                : <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground text-xs font-mono">{path}</p>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance-dokumenter */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Compliance-dokumenter (24B)</h2>
        </div>
        <div className="grid gap-2 text-sm">
          {[
            { label: "Gap-analyse", path: "docs/COMPLIANCE_GAP_ANALYSIS.md", desc: "Detaljert vurdering av alle HMS- og GDPR-gap" },
            { label: "Compliance backlog", path: "docs/COMPLIANCE_BACKLOG.md", desc: "P0/P1/P2-prioritert liste over tiltak" },
            { label: "Personvern og GDPR", path: "docs/PRIVACY_AND_GDPR.md", desc: "Behandlingsgrunnlag, databehandlere, lagringstid" },
          ].map(({ label, path, desc }) => (
            <div key={path} className="rounded-xl bg-muted/40 px-4 py-3">
              <p className="font-medium">{label}</p>
              <p className="text-muted-foreground text-xs font-mono">{path}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lenker */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/personvern"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Personvernside for ansatte
        </Link>
        <Link
          href="/admin/system"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Systemstatus og audit-logg
        </Link>
      </section>
    </div>
  );
}
