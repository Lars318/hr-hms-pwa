import { Shield, Mail, FileText, Info, Clock, AlertTriangle } from "lucide-react";

export const metadata = { title: "Personvern – HR/HMS" };

export default function PersonvernPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Personvern</h1>
        <p className="text-muted-foreground mt-1">
          Informasjon om hvilke opplysninger HR/HMS-portalen lagrer og hvordan de brukes.
        </p>
      </div>

      {/* Formål */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <Shield className="h-5 w-5 text-blue-500" />
          Formål
        </div>
        <p className="text-sm text-muted-foreground">
          HR/HMS-portalen er et internt verktøy for HMS-systematikk, fravær, overtid/timebank,
          dokumentstyring og personalhåndbok. Appen brukes utelukkende i arbeidsgiver-/arbeidstakerforholdet
          og behandler kun opplysninger som er nødvendige for dette formålet.
        </p>
      </section>

      {/* Hvilke data */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5 text-blue-500" />
          Hvilke opplysninger lagres
        </div>
        <div className="grid gap-2 text-sm">
          {[
            ["Grunndata", "Navn, e-postadresse, stilling, avdeling og lokasjon."],
            ["Fravær", "Type fravær (inkl. sykefravær), periode og status. Ingen diagnose eller medisinsk informasjon."],
            ["Overtid/timebank", "Registrerte overtidstimer, type og saldo. Se avgrensning nedenfor."],
            ["HMS-hendelser", "Avviksmeldinger, risikovurderinger og tiltak du er involvert i."],
            ["Dokumentlesing", "Bekreftelse på at du har lest obligatoriske dokumenter."],
            ["Varsler", "Varsler du har mottatt og om de er lest."],
            ["Aktivitetslogg", "Logg over vesentlige handlinger for sporbarhet og sikkerhet."],
          ].map(([label, desc]) => (
            <div key={label} className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="font-medium">{label}</p>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avgrensning arbeidstid */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-800">
          <Info className="h-5 w-5" />
          Avgrensning – arbeidstidsregistrering
        </div>
        <p className="text-sm text-amber-700">
          Denne portalen håndterer kun <strong>overtid og timebank</strong>. Full daglig
          arbeidstidsregistrering (jf. arbeidsmiljøloven §10-7) håndteres i separate systemer.
          AMU (arbeidsmiljøutvalg) og BHT (bedriftshelsetjeneste) er ikke implementert i
          portalen per nå.
        </p>
      </section>

      {/* Lagringstid */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="h-5 w-5 text-blue-500" />
          Lagringstid
        </div>
        <p className="text-sm text-muted-foreground">
          Opplysninger lagres kun så lenge det er nødvendig for formålet og i henhold til
          lovpålagte oppbevaringskrav. Generelt gjelder:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Ansatteprofil: frem til ansettelsesforholdet avsluttes, deretter 3 år.</li>
          <li>Fravær og overtid: 5 år.</li>
          <li>HMS-data (avvik, risiko, tiltak): 5 år.</li>
          <li>Aktivitetslogg: 2 år.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Formell retention-policy er under utarbeiding. Ta kontakt med HR for spørsmål.
        </p>
      </section>

      {/* Rettigheter */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5 text-blue-500" />
          Dine rettigheter
        </div>
        <div className="grid gap-2 text-sm">
          {[
            ["Innsyn", "Du kan be om innsyn i hvilke opplysninger om deg som er lagret."],
            ["Retting", "Du kan be om at feilaktige opplysninger rettes."],
            ["Sletting", "Du kan be om sletting av opplysninger som ikke lenger er nødvendige."],
            ["Dataportabilitet", "Du kan be om en kopi av dine opplysninger i maskinlesbart format."],
          ].map(([label, desc]) => (
            <div key={label} className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="font-medium">{label}</p>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kontakt */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <Mail className="h-5 w-5 text-blue-500" />
          Kontakt og forespørsler
        </div>
        <p className="text-sm text-muted-foreground">
          For spørsmål om personvern, innsyn, retting eller sletting – ta kontakt med HR:
        </p>
        <a
          href="mailto:hr@pulsfollo.no"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Mail className="h-4 w-4" />
          hr@pulsfollo.no
        </a>
        <p className="text-sm text-muted-foreground">
          Forespørsler besvares innen 30 dager i henhold til personvernforordningen (GDPR).
        </p>
        <p className="text-sm text-muted-foreground">
          Du kan også klage til{" "}
          <a
            href="https://www.datatilsynet.no"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Datatilsynet
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Sist oppdatert: Juni 2026. Intern versjon 1.0 – ikke juridisk godkjenning.
      </p>
    </div>
  );
}
