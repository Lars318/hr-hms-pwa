# Databehandleravtaler (DPA) – Sjekkliste

> **Versjon:** 1.0 – Juni 2026  
> **Merk:** Må bekreftes og signeres av daglig leder før pilot. Ikke juridisk godkjenning.  
> **Hjemmel:** GDPR art. 28 krever skriftlig databehandleravtale med alle leverandører som behandler personopplysninger på vegne av virksomheten.

---

## Status

| Leverandør | Rolle | Data som behandles | DPA-status | Tiltak | Eier | Frist |
|---|---|---|---|---|---|---|
| **Supabase** | Databehandler | All persondata (database + fillagring + autentisering) | ⬜ Ikke inngått | Aksepter DPA i Supabase-prosjektinnstillinger (Enterprise DPA tilgjengelig på supabase.com/dpa) | Daglig leder / IT | Før pilot |
| **Vercel** | Databehandler | Serverside-kode kjøres her – kan eksponeres for persondata i request/response | ⬜ Ikke inngått | Aktiver Vercel DPA (tilgjengelig under Team Settings → Legal) | Daglig leder / IT | Før pilot |
| **Resend** | Databehandler | E-postvarsler: mottakers navn og e-postadresse, varselinnhold | ⬜ Ikke inngått | Aksepter DPA i Resend-kontoinnstillinger | Daglig leder / IT | Før pilot |
| **Sentry** | Databehandler | Feillogging – kan inneholde persondata i stacktraces og request-data | ⬜ Ikke inngått | Inngå DPA via Sentry (tilgjengelig for Business/Enterprise). Vurder å maskere persondata i Sentry-konfigurasjon. | Daglig leder / IT | Før pilot |
| **Teams / externe integrasjoner** | Ikke aktuelt | Teams og externe samhandlingsintegrasjoner er **ikke i scope** | ⛔ Ikke i scope | Ingen tiltak nødvendig | — | Ikke aktuelt |
| **E-signeringsleverandør** | Ikke aktuelt ennå | E-signering er kun mock/testmodus – ingen ekte leverandør tilkoblet | ⏳ Ikke aktuelt nå | Velg leverandør og inngå DPA når ekte e-signering skal implementeres | Daglig leder | Før ekte e-signering |

---

## Krav til DPA-innhold (GDPR art. 28(3))

Hver DPA skal minimum dekke:

- [ ] Behandlingens gjenstand og varighet
- [ ] Behandlingens art og formål
- [ ] Type personopplysninger og kategorier av registrerte
- [ ] Den behandlingsansvarliges rettigheter og plikter
- [ ] Krav om konfidensialitet
- [ ] Krav om sikkerhetstiltak (art. 32)
- [ ] Bruk av underdatabehandlere (godkjenning kreves)
- [ ] Bistand til den behandlingsansvarliges oppfyllelse av rettigheter
- [ ] Sletting eller tilbakelevering av data ved opphør
- [ ] Rett til revisjon/innsyn

---

## Geografisk plassering av data

Bekreft at alle leverandører behandler data i EU/EØS, eller at det foreligger et gyldig overføringsgrunnlag (SCCs):

| Leverandør | Dataregion | Status |
|---|---|---|
| Supabase | EU (Frankfurt) – standard, men bekreft i prosjektinnstillinger | ⬜ Ikke bekreftet |
| Vercel | Kan konfigureres til EU – bekreft Edge-funksjonskonfigurasjon | ⬜ Ikke bekreftet |
| Resend | Bekreft dataregion i kontoinnstillinger | ⬜ Ikke bekreftet |
| Sentry | EU-region tilgjengelig – bekreft konfigurasjon | ⬜ Ikke bekreftet |

---

## Underdatabehandlere

Be hver leverandør om liste over underdatabehandlere. Relevante eksempler:
- Supabase bruker AWS (Frankfurt)
- Vercel bruker AWS og andre skyleverandører

---

## Oppbevaringssted for signerte DPA-er

Signerte DPA-er skal oppbevares:
- **Sted:** [Legg inn intern filserver/SharePoint-lenke]
- **Ansvarlig:** Daglig leder
- **Gjennomgang:** Minimum hvert 2. år, eller ved vesentlig endring hos leverandør

---

*Sist oppdatert: 2026-06-14*
