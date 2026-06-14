# Roadmap – Neste steg for HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> **Kontekst:** Etter Steg 25A (varslingsmodul). Teknisk klar, juridisk delvis klar.  
> **Viktig:** Teams, Microsoft Graph, Power Automate og andre eksterne samhandlingsintegrasjoner er **ikke i scope**. Se «Ikke bygg ennå»-seksjonen.

---

## Fase 1 – Stabilisering og pilot

*Mål: Klar til å kjøre pilot med ekte ansatte*  
*Kompleksitet: Lav–Medium*

### 1.1 Juridisk/operasjonelle avklaringer (ledelsesbeslutning)

| Tiltak | Hvorfor | Risiko | Kompleksitet |
|---|---|---|---|
| Inngå DPA med Supabase | GDPR art. 28 — blokkerer pilot | Høy — bøter | Lav (admin-oppgave) |
| Inngå DPA med Vercel | GDPR art. 28 | Høy | Lav |
| Inngå DPA med Resend | GDPR art. 28 | Høy | Lav |
| Inngå DPA med Sentry | GDPR art. 28 | Høy | Lav |
| Juridisk bekreftelse av behandlingsgrunnlag | Særlig sykefravær (art. 9) | Høy | Lav (juridisk vurdering) |
| Godkjenn retention policy | GDPR art. 5(1)(e) | Middels | Lav |
| Fyll ut kontaktpersoner i breach-rutinen | Operasjonell beredskap | Middels | Lav |

### 1.2 Teknisk pilot-klargjøring

| Tiltak | Hvorfor | Risiko | Kompleksitet |
|---|---|---|---|
| Sett opp prod Supabase-prosjekt | Pilot skal ikke kjøre på dev-DB | Høy | Medium |
| Kjør `prisma db push` mot prod | Skjema i sync | Høy | Lav |
| Konfigurer Sentry DSN i Vercel | Overvåkning i prod | Middels | Lav |
| Fjern/merk testdata fra prod | GDPR, profesjonalitet | Middels | Lav |
| Bekreft miljøvariabler i prod | App virker | Høy | Lav |
| Opprett produksjonsbrukere med riktige roller | Ansatte får tilgang | Høy | Lav |

### 1.3 Teknisk smoke-test (per rolle)

| Tiltak | Hvorfor | Risiko | Kompleksitet |
|---|---|---|---|
| Full RBAC smoke-test (alle 4 roller) | Verifiser at RBAC virker | Høy | Lav |
| Mobil smoke-test (390px) | PWA er kritisk for feltsjefer | Middels | Lav |
| Push-varsel smoke-test iOS + Android | Varslingsflyt | Middels | Lav |
| Avvik end-to-end test | Kjernefunksjon | Høy | Lav |
| Overtid end-to-end test | Kjernefunksjon | Høy | Lav |
| Varslingssak end-to-end test | Ny modul | Middels | Lav |

---

## Fase 2 – HMS-moduler (P1)

*Mål: Fullstendig HMS-compliance for bredere utrulling*  
*Estimert rekkefølge: Etter vellykket pilot*

### 2.1 HMS-opplæringsregister (Steg 27A) ✅ FERDIG

**Hva:** Register over hvem som har fått hvilken HMS-opplæring, når og av hvem.  
**Status:** ✅ Implementert — TrainingCourse, TrainingRecord, TrainingAuditLog. UI, rapport og navigasjon på plass.

### 2.2 Stoffkartotek / Kjemikalier (Steg 27B) ✅ FERDIG

**Hva:** Register over kjemikalier og farlige stoffer (SDS-datablad).  
**Hvorfor:** Relevant for renholdsavdeling. Forskrift om utførelse av arbeid §5-1.  
**Risiko:** Arbeidstilsyn-avvik.  
**Kompleksitet:** Medium  
**Anbefalt rekkefølge:** #2

### 2.3 Datainnsyn / Self-service eksport (Steg 25D)

**Hva:** GDPR art. 15/20 — ansatt kan eksportere egne personopplysninger.  
**Hvorfor:** Lovkrav. Reduserer manuell jobb for HR.  
**Risiko:** GDPR-avvik uten løsning.  
**Kompleksitet:** Medium  
**Anbefalt rekkefølge:** #3

### 2.4 Kommentarer på saker internt (Steg 25E)

**Hva:** Intern dialog på avvik, risiko og tiltak — uten ekstern integrasjon.  
**Hvorfor:** Meldinger-funksjonalitet finnes i varslingsmodulen — kan gjenbrukes.  
**Risiko:** Lav.  
**Kompleksitet:** Lav  
**Anbefalt rekkefølge:** #4 (kan kombineres med annet steg)

### 2.5 Grensevarsel overtid (Aml §10-6)

**Hva:** Informativt varsel når ansatt nærmer seg 10t/dag eller 300t/år.  
**Hvorfor:** Aml §10-6 setter grenser for overtid. Ledere bør varsles.  
**Risiko:** Arbeidstilsyn-avvik.  
**Kompleksitet:** Lav  
**Anbefalt rekkefølge:** #5

### 2.6 Automatisk fraværsoppfølging (Aml §4-6 dialogmøter)

**Hva:** Påminnelse ved 4 uker og 8 uker sykefravær for dialogmøte.  
**Hvorfor:** Aml §4-6 krever oppfølging ved langtidsfravær.  
**Kompleksitet:** Medium

### 2.7 Retention-admin for HR

**Hva:** Enkel UI for manuell sletting/anonymisering av utgåtte data.  
**Hvorfor:** GDPR art. 5(1)(e) lagringstidsprinsipp.  
**Kompleksitet:** Medium

---

## Fase 3 – HR-administrasjon (P2)

*Mål: Mer komplett HR-system*  
*Tidspunkt: Etter vellykket bredere utrulling*

### 3.1 Onboarding-sjekklister

**Hva:** Sjekkliste for nye ansatte.  
**Kompleksitet:** Lav  
**Anbefalt rekkefølge:** #1 i fase 3

### 3.2 Kontrakter og kontraktsmaler

**Hva:** Lagre og spore arbeidskontrakter.  
**Kompleksitet:** Medium  
**Avhengig av:** e-signering (se under)

### 3.3 E-signering

**Hva:** Integrasjon med e-signering (f.eks. Signicat, BankID, DocuSign).  
**Kompleksitet:** Høy  
**Merknad:** Krever ny DPIA og DPA med e-signeringsleverandør.

### 3.4 Stillingsbeskrivelser

**Hva:** Database over stillingsbeskrivelser knyttet til profiler.  
**Kompleksitet:** Lav

---

## Fase 4 – Produksjonssetting

*Mål: Bredere utrulling etter pilot*

| Tiltak | Prioritet |
|---|---|
| Sikkerhetsgjennomgang (pen-test eller kode-audit) | Høy |
| Backup/restore-test | Høy |
| Opplæring av alle ansatte (EMPLOYEE-rolle) | Høy |
| Opplæring av ADMIN/HR/MANAGER | Høy |
| Definere supportprosess | Middels |
| Sette opp monitorering (Vercel + Sentry alerts) | Middels |
| Release checklist gjennomgang | Middels |
| DPIA (Data Protection Impact Assessment) | Lav–Middels |

---

## Ikke bygg ennå

Disse bør parkeres til separat vurdering og eksplisitt beslutning:

| Område | Begrunnelse |
|---|---|
| **Teams og andre eksterne samhandlingsintegrasjoner** | Teams og andre eksterne samhandlingsintegrasjoner er ikke i scope nå. Eventuelle slike integrasjoner må vurderes separat senere med ny DPIA/personvernvurdering og databehandleravtaler. |
| Microsoft Graph | Som over |
| Power Automate | Som over |
| Arbeidstidsregistrering (full) | Håndteres i andre systemer. Appen dekker kun overtid/timebank. |
| AMU (Arbeidsmiljøutvalg) | Ikke aktuelt for virksomheten per i dag |
| BHT (Bedriftshelsetjeneste) | Ikke aktuelt per i dag |
| Lønn og økonomi | Separat system, krever annen integrasjon |
| Full chat-funksjonalitet | Ikke i scope — intern dialog på saker er tilstrekkelig |
| Ekstern anonym varslingsportal | Krever separat vurdering, DPIA og leverandør |
| Avansert KPI-dashboard | P2 — ikke kritisk for pilot |
| Automatisk dataminimering/GDPR-crawler | P2 |

---

## Prioritert rekkefølge — oppsummert

1. 🔴 **DPA-er signert** (ledelsesbeslutning — blokkerer pilot)
2. 🔴 **Prod-miljø satt opp** (Supabase prod + Vercel env vars)
3. ⚠️ **Full smoke-test alle roller**
4. ✅ **HMS-opplæringsregister** (Steg 27A — ferdig)
5. ⚠️ **Stoffkartotek** (Steg 25C)
6. ⚠️ **Datainnsyn/self-service eksport** (Steg 25D)
7. 📝 **Kommentarer på saker** (Steg 25E)
8. 📝 **Kontrakter** (Fase 3 — etter vellykket pilot)

---

*Sist oppdatert: 2026-06-14*
