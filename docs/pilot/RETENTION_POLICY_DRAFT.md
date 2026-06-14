# Lagringstid og sletting – Utkast til policy

> **Versjon:** 1.0 – Juni 2026  
> **Status:** UTKAST – MÅ godkjennes av daglig leder og eventuelt juridisk rådgiver.  
> **Hjemmel:** GDPR art. 5(1)(e) krever at personopplysninger ikke lagres lenger enn nødvendig for formålet.  
> **Merk:** Automatisk sletting er ikke implementert. Sletting skjer manuelt av ADMIN/HR inntil videre.

---

## Lagringstid per datatype

| Datatype | Lagringstid | Hva gjøres ved utløp | Kan anonymiseres? | Hvem godkjenner sletting | Lovkrav/begrunnelse |
|---|---|---|---|---|---|
| **Ansattprofil (aktiv)** | Aktiv ansettelse | Deaktiveres ved opphør | Nei – identifiserende for historikk | ADMIN | Aml, lønns-/pensjonsdokumentasjon |
| **Ansattprofil (avsluttet)** | 3 år etter avsluttet ansettelse | Slettes/anonymiseres | Ja – navn og kontaktinfo kan fjernes | ADMIN + daglig leder | Bokføringsloven, eventuelle krav |
| **Avviksmeldinger** | 5 år fra registreringsdato | Slettes | Ja – navn kan fjernes, hendelse beholdes som statistikk | ADMIN + HR | IK-HMS, Aml – dokumentasjonsplikt |
| **Risikovurderinger** | 5 år fra dato, eller til ny versjon foreligger | Arkiveres, eldre slettes | Ja – navn på ansvarlig kan fjernes | ADMIN + HMS-ansvarlig | IK-HMS |
| **Tiltak** | 5 år fra fullført/avsluttet | Slettes | Ja – navn kan fjernes | ADMIN + HR | IK-HMS |
| **Fravær (inkl. sykefravær)** | 5 år fra fraværsperiode | Slettes | Nei (sykefravær særlig kategori – må slettes, ikke anonymiseres) | ADMIN + HR | Aml §4-6, NAV, lønnsgrunnlag |
| **Overtid/timebank** | 5 år fra registreringsdato | Slettes | Nei | ADMIN + HR | Aml §10-6, lønnsgrunnlag |
| **Dokumenter (filer)** | Etter dokumentets relevansperiode + 3 år | Arkiveres eller slettes | N/A | ADMIN + HR | Intern vurdering |
| **Lesebekreftelser (dok.)** | 3 år etter siste versjon av dokumentet | Slettes | Nei | ADMIN | Dokumentasjonsplikt |
| **Personalhåndbok-bekreftelser** | Aktiv ansettelse + 3 år | Slettes | Nei | ADMIN + HR | Intern |
| **Varsler** | 1 år fra sending | Slettes | Ja | Automatisk (fremtidig) / ADMIN | Driftsformål |
| **Audit-logg** | 2 år fra hendelse | Slettes | Nei – logg skal beholdes intakt | ADMIN | Sikkerhet, etterforskning |
| **Push-abonnementer** | Til avmelding eller ansettelsesslutt | Slettes | N/A | Automatisk | Samtykkebasert |
| **Rapporter (eksporterte CSV-er)** | Lagres ikke i appen | N/A | N/A | Mottaker av rapport | Behandles av mottaker |
| **Opplastede filer (Supabase Storage)** | Samme som tilhørende dokument | Slettes fra bucket | N/A | ADMIN | Kobles til dokumentpolicy |

---

## Hva skal beholdes som dokumentasjon

Selv etter sletting av personopplysninger, bør følgende beholdes:
- Anonymisert avviks-/hendelsesstatistikk
- Anonymiserte risikovurderingsoversikter
- Fraværsstatistikk uten navn
- Audit-logg frem til utløp (2 år)
- Dokumentasjon på at DPA-er er inngått

---

## Sletteprosess (manuell inntil videre)

1. **Hvem kan be om sletting:** HR, ADMIN, eller den registrerte selv (via innsynsforespørsel)
2. **Hvem godkjenner:** Daglig leder + ADMIN for profilsletting. HR + ADMIN for øvrig.
3. **Gjennomføring:** ADMIN gjennomfører sletting i databasen via admin-verktøy.
4. **Dokumentasjon:** Slettehandling skal loggføres med hvem som godkjente, hva som ble slettet, og dato.
5. **Filer i Supabase Storage:** Slettes separat i Supabase-dashboardet.

---

## Hva krever juridisk avklaring

- [ ] Nøyaktig lagringstid for sykefravær (NAV vs. GDPR)
- [ ] Om personalmappe-opplysninger har lengre oppbevaringsplikt enn 3 år
- [ ] Eventuell konflikt mellom bokføringsloven og GDPR-sletteplikt
- [ ] Krav til anonymisering vs. fullstendig sletting
- [ ] Om anonymiserte data fremdeles regnes som personopplysninger

---

## Periodisk gjennomgang

Retention policy skal gjennomgås:
- Minimum hvert 2. år
- Ved vesentlig endring i lovverk
- Ved ny funksjonalitet som behandler nye kategorier personopplysninger

---

*Sist oppdatert: 2026-06-14*
