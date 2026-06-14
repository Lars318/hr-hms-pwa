# Compliance Backlog – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> Se `COMPLIANCE_GAP_ANALYSIS.md` for full begrunnelse.  
> Se `PRIVACY_AND_GDPR.md` for GDPR-detaljer.

---

## Avgrensninger – bevisst utenfor scope

| Område | Begrunnelse |
|---|---|
| **Arbeidstidsregistrering** | Håndteres i andre systemer. Appen er kun overtid/timebank. |
| **AMU – Arbeidsmiljøutvalg** | Ikke aktuelt for virksomheten per i dag. |
| **BHT – Bedriftshelsetjeneste** | Ikke aktuelt per i dag. |

---

## P0 – Må på plass før pilot

Disse tiltakene er kritiske for at appen kan tas i bruk i organisasjonen.

| # | Tiltak | Type | Ansvarlig | Status |
|---|---|---|---|---|
| P0-1 | Personvernerklæring for ansatte (intern, forenklet) | Dokument + app-side `/personvern` | Daglig leder / HR | ✅ Gjort i 24B |
| P0-2 | Dokumentere behandlingsgrunnlag per kategori (Aml §15-1, GDPR art. 6) | Dokument | Daglig leder | ⬜ Ikke startet |
| P0-3 | Dokumentere og inngå databehandleravtaler (Supabase, Vercel, Resend, Sentry) | Juridisk/IT | Daglig leder | ⬜ Ikke startet |
| P0-4 | Dokumentere hvilke personopplysninger appen behandler | Dokument (se PRIVACY_AND_GDPR.md) | IT/HR | ✅ Utkast i PRIVACY_AND_GDPR.md |
| P0-5 | Dokumentere tilgangsstyring per rolle og lokasjon | Dokument (se PRIVACY_AND_GDPR.md) | IT | ✅ Utkast i PRIVACY_AND_GDPR.md |
| P0-6 | Dokumentere lagringstid/retention per datakategori | Dokument | HR/IT | ⬜ Ikke startet |
| P0-7 | Tydelig avgrensning i UI: appen er ikke full arbeidstidsregistrering | App (overtid-side) | IT | ✅ Gjort |
| P0-8 | Dokumentere verneombud og HMS-ansvar per lokasjon | App + dokument | HR | ✅ I lokasjonsmodulen |
| P0-9 | Sikre at avvik/risiko/tiltak har sporbarhet | App | IT | ✅ Audit-logg finnes |
| P0-10 | Dokumentere rutine for personvernbrudd (varsling Datatilsynet 72t) | Dokument | Daglig leder | ✅ Utkast i 24C – godkjennes av daglig leder |
| P0-11 | Dokumentere prosess for innsyn, retting og sletting | Dokument + personvernside | HR | ✅ Utkast i 24C – gjennomgås av HR |

---

## P1 – Bør på plass før bred utrulling

| # | Tiltak | Type | Kommentar |
|---|---|---|---|
| P1-1 | **Varslingsmodul** for kritikkverdige forhold (whistleblowing) | Ny modul | ✅ **Gjort i 25A** – intern modul. Anonym ekstern kanal gjenstår. |
| P1-2 | **HMS-opplæringsregister** | Ny modul | Hvem har fått opplæring, når, av hvem. Aml §3-5. |
| P1-3 | **Stoffkartotek/kjemikalier** | Ny modul | Relevant for renholdsavdeling. Forskrift om utførelse av arbeid. |
| P1-4 | Eksport/innsyn for ansattes egne personopplysninger | Ny funksjon | GDPR art. 15. «Mine data»-eksport. |
| P1-5 | Lagringstid-admin (retention) for HR | Ny funksjon | Manuell eller halvautomatisk sletting per kategori. |
| P1-6 | Personvernside i appen (`/personvern`) | App-side | ✅ Gjort i 24B. |
| P1-7 | Compliance-side for ADMIN/HR/HMS (`/admin/compliance`) | App-side | ✅ Gjort i 24B. |
| P1-8 | Automatisk fristbrudd-notifikasjon for tiltak | App | Varsle ansvarlig ved utløpt frist. |
| P1-9 | Langtidsfraværsoppfølging (4/8 uker dialogmøte-påminnelse) | App | Aml §4-6, NAV-krav. |
| P1-10 | Dokumentutløp-notifikasjon (bruk `expiresAt`-feltet) | App | Feltet finnes, varslingen mangler. |
| P1-11 | Automatisk deaktivering av profil ved avsluttet ansettelse | App | GDPR tilgangsstyring. Bør knyttes til offboarding-rutine. |
| P1-12 | Periodisk revurdering av risikovurderinger (påminnelse) | App | Aml §3-1. |
| P1-13 | Dataminimering-gjennomgang (formell) | Dokument | Sikre at alle felt i datamodellen er nødvendige. |

---

## P2 – Senere forbedringer

| # | Tiltak | Kommentar |
|---|---|---|
| P2-1 | Automatisk planlagt rapport (månedlig) til HR/leder | Forbedring |
| P2-2 | Avvikstrend-rapport (gjentakende avvik) | Forbedring |
| P2-3 | Automatisk purring til ansatte som ikke har lest obligatoriske dokumenter | Forbedring |
| P2-4 | Historikk over verneombudsvalg per lokasjon | Forbedring |
| P2-5 | HMS-snarvei og -informasjon på ansatt-dashboard | UX |
| P2-6 | Grensevarsler for overtid (Aml §10-6 max 10t/dag, 300t/år) | App – kun informativt |
| P2-7 | ~~Teams-varsler~~ → **Ikke i scope** – se «Ikke bygg ennå»-seksjonen | Integrasjon |
| P2-8 | Kontrakter og e-signering | Ny modul |
| P2-9 | Avansert compliance-dashboard med KPI-er | Dashboard |
| P2-10 | DPIA (Data Protection Impact Assessment) | Juridisk/IT |

---

## Ikke i scope nå

| Område | Begrunnelse |
|---|---|
| Arbeidstidsregistrering (full) | Andre systemer håndterer dette. |
| AMU – Arbeidsmiljøutvalg | Ikke aktuelt per i dag. |
| BHT – Bedriftshelsetjeneste | Ikke aktuelt per i dag. |
| Lønnsintegrering | Eget system. |
| E-signering av kontrakter | Fremtidig modul. |

---

*Sist oppdatert: 2026-06-14*
