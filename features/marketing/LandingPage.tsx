import Link from "next/link";
import {
  ArrowRight, ShieldAlert, CalendarDays, ClipboardList, Receipt,
  FolderOpen, GraduationCap, Bell, Smartphone, Sparkles, CheckCircle2,
} from "lucide-react";
import { PulsfolloLogo } from "@/components/PulsfolloLogo";

const FEATURES = [
  { icon: CalendarDays, title: "Fravær & tid", desc: "Egenmelding, ferie og overtid med godkjenning og full oversikt." },
  { icon: ShieldAlert, title: "HMS & avvik", desc: "Meld avvik, følg opp tiltak og hold risikovurderinger oppdatert." },
  { icon: ClipboardList, title: "Internkontroll", desc: "Brannvern, el-sikkerhet og vernerunder med årshjul og varsler." },
  { icon: Receipt, title: "Økonomi & kontrakter", desc: "Hold styr på leie- og leverandørkontrakter — med varsel før de utløper." },
  { icon: FolderOpen, title: "Dokumenter", desc: "Personalhåndbok og dokumentarkiv tilgjengelig for alle ansatte." },
  { icon: GraduationCap, title: "Kompetanse", desc: "Opplæring, sertifikater og kompetansematrise på ett sted." },
];

const HIGHLIGHTS = [
  { icon: Smartphone, title: "Fungerer som en app", desc: "Installer på mobilen og få full tilgang — også på farten." },
  { icon: Bell, title: "Smarte varsler", desc: "Push når noe forfaller, skal godkjennes eller krever oppfølging." },
  { icon: Sparkles, title: "AI-assistert", desc: "La AI lese kontrakter og fylle ut detaljene automatisk." },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <PulsfolloLogo size={26} />
          <span className="text-lg font-bold tracking-tight">Truls HR</span>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Logg inn
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-12 sm:pt-16 grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F6E7DE] px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5000]" />
            HR & HMS for Pulsfollo
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
            Alt for HR og HMS — samlet på ett sted.
          </h1>
          <p className="text-lg text-slate-600 max-w-md">
            Fravær, avvik, internkontroll, kontrakter og dokumenter. Truls HR gir hele
            organisasjonen oversikt og trygghet — rett i lomma.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Logg inn <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funksjoner"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Se funksjoner
            </a>
          </div>
        </div>

        {/* Telefon-mockup i sirkel */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 m-auto h-72 w-72 sm:h-80 sm:w-80 rounded-full bg-[#F6CDBE]" />
          <PhoneMockup />
        </div>
      </section>

      {/* ── Funksjoner ── */}
      <section id="funksjoner" className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Én app for hele arbeidshverdagen
            </h2>
            <p className="mt-3 text-slate-600">
              Bygget for ledere og ansatte — enkelt å bruke, og dekker kravene til
              systematisk HMS-arbeid.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights (varm seksjon) ── */}
      <section className="bg-[#F6E7DE] py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid sm:grid-cols-3 gap-8">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA-band ── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Klar til å komme i gang?
          </h2>
          <p className="text-primary-foreground/70">
            Logg inn med e-posten din, eller bruk Face ID. Installer appen på mobilen for
            rask tilgang.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
            {["Sikker innlogging", "Fungerer offline for data", "GDPR-vennlig"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {t}
              </span>
            ))}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary hover:opacity-90 transition-opacity"
          >
            Logg inn <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <PulsfolloLogo size={20} />
            <span className="font-semibold text-slate-700">Truls HR</span>
            <span>· Pulsfollo</span>
          </div>
          <span>© {new Date().getFullYear()} Pulsfollo</span>
        </div>
      </footer>
    </main>
  );
}

/** Stilisert telefon som viser en mini-versjon av appen. */
function PhoneMockup() {
  return (
    <div className="relative w-56 sm:w-64 rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="rounded-[1.8rem] overflow-hidden bg-white">
        {/* App-header */}
        <div className="bg-primary px-4 pt-6 pb-5 text-primary-foreground">
          <div className="flex items-center gap-1.5">
            <PulsfolloLogo size={16} />
            <span className="text-xs font-bold">Truls HR</span>
          </div>
          <p className="mt-4 text-[11px] text-primary-foreground/70">God morgen</p>
          <p className="text-lg font-bold leading-tight">Velkommen tilbake</p>
        </div>
        {/* Mini-kort */}
        <div className="p-3 space-y-2 bg-slate-50">
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: "Fravær", v: "25", u: "dager" },
              { t: "Avvik", v: "3", u: "åpne" },
            ].map((c) => (
              <div key={c.t} className="rounded-xl bg-white border p-2.5">
                <p className="text-[9px] text-slate-500">{c.t}</p>
                <p className="text-base font-bold leading-none mt-1">{c.v}</p>
                <p className="text-[8px] text-slate-400">{c.u}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white border p-2.5 flex items-center gap-2">
            <div className="h-6 w-6 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold leading-tight">Internkontroll</p>
              <p className="text-[8px] text-emerald-600">Alt à jour</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border p-2.5 flex items-center gap-2">
            <div className="h-6 w-6 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold leading-tight">Kontrakter</p>
              <p className="text-[8px] text-slate-400">Ingen utløper snart</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
