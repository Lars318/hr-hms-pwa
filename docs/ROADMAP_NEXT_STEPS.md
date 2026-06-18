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

### 2.3 Datainnsyn / Self-service eksport (Steg 27C) ✅ FERDIG

**Hva:** GDPR art. 15/16/17/20 — ansatt sender forespørsel, HR behandler innen 30 dager.  
**Resultat:** DataSubjectRequest-modell, tRPC-router, ansatt- og HR-sider, varsler. Typecheck grønn.

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

### 3.3 E-signering (Steg 30B) ✅ MOCK IMPLEMENTERT

**Hva:** Mock/simulator av e-signeringsflyt — viser flyten uten ekte integrasjon.  
**Status:** ✅ Mock ferdig

> ⚠️ **TESTMODUS — INGEN EKTE SIGNATUR:** Den nåværende implementasjonen bruker en mock-adapter. Det er INGEN integrasjon med BankID, Signicat, eller andre e-signeringstjenester. Signaturer produsert i systemet er IKKE juridisk bindende.

**For å bytte til ekte e-signering:**
1. Implementer `SigningProvider`-interfacet i `lib/esignering/provider.ts`
2. Bytt ut `mockSigningProvider` i `server/routers/signature.ts`
3. Gjennomfør ny DPIA
4. Inngå DPA med e-signeringsleverandør
5. Kompleksitet: Høy

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
5. ✅ **Stoffkartotek** (Steg 27B — ferdig)
6. ✅ **Datainnsyn/self-service eksport** (Steg 27C — ferdig)
7. ✅ **Onboarding/offboarding** (Steg 28A — ferdig)
8. ✅ **Medarbeidersamtaler** (Steg 28B — ferdig)
9. ✅ **Advarsler/personalsaker** (Steg 28C — ferdig)
10. ✅ **Kommentarer på saker** (Steg 29A — ferdig)
11. ✅ **Kontrakter** (Steg 30A — ferdig)
12. ✅ **E-signering mock** (Steg 30B — ferdig)
13. 📝 **Lønnsintegrasjon** (Steg 31A — venter på avklaring)

---

*Sist oppdatert: 2026-06-15*

---

## Assistent V2 (fremtidig, ikke planlagt)

Dersom regelbasert V1 viser seg å ha for lav treffsikkerhet, kan V2 vurderes med:
- RAG (Retrieval-Augmented Generation) mot personalhåndbokens seksjoner
- OpenAI eller selvhostet LLM (Ollama/Mistral)
- Krav: ny DPIA, DPA med AI-leverandør, og godkjenning fra ledelsen

**V2 skal IKKE bygges uten:** eksplisitt ledelsesbeslutning, DPIA-vurdering, og at piloten har vist behov.
