# Pilot Readiness Status – HR/HMS PWA

> **Dato:** 2026-06-15  
> **Status:** Nesten klar – teknisk · Juridisk gjenstår

---

## Statuser brukt

| Symbol | Betydning |
|---|---|
| ✅ Klar | Implementert og verifisert |
| ⚠️ Nesten klar | Funksjonelt men begrensninger |
| 🔴 Må fikses | Blokkerer pilot |
| ⛔ Ikke i scope | Bevisst utenfor pilot |

---

## 1. Teknisk stabilitet

**Status: ✅ Klar**

| Sjekk | Status | Kommentar |
|---|---|---|
| TypeScript: 0 feil | ✅ | Verifisert 2026-06-15 |
| `npm run build` rent | ✅ | Alle ruter grønne |
| Prisma-skjema i sync | ✅ | `prisma db push` kjørt |
| Prisma Client generert | ✅ | |
| Alle moduler operasjonelle | ✅ | 26+ moduler (inkl. 28A–30B) |
| tRPC-routers registrert | ✅ | 26 routers |

---

## 2. Sikkerhet

**Status: ✅ Klar (for pilot)**

| Sjekk | Status | Kommentar |
|---|---|---|
| `.env` i `.gitignore` | ✅ | |
| Service role key ikke eksponert | ✅ | |
| Storage bucket privat | ✅ | incident-attachments, documents, contracts |
| Signerte URLer for filer | ✅ | Kontrakter: 300 sek, vedlegg: 60 sek |
| Rate limiting på upload | ✅ | |
| RBAC server-side | ✅ | tRPC procedures |
| HTTPS (Vercel) | ✅ | Automatisk |
| Sentry feillogging | ✅ | Må konfigureres med DSN i prod |

**Gjenstår for prod:**
- Verifiser CSP-headers i Vercel-dashboardet
- Sjekk at `NEXT_PUBLIC_SUPABASE_ANON_KEY` er anon-key, ikke service_role
- Konfigurer Sentry DSN og varsler for kritiske feil

---

## 3. GDPR / P0-status

**Status: ⚠️ Nesten klar – 8/11 P0 gjennomført**

| P0 | Status |
|---|---|
| P0-1: Personvernerklæring `/personvern` | ✅ |
| P0-2: Behandlingsgrunnlag dokumentert | ⚠️ Utkast – juridisk bekreftelse mangler |
| P0-3: DPA med Supabase/Vercel/Resend/Sentry | 🔴 Ikke inngått |
| P0-4: Personopplysninger dokumentert | ✅ |
| P0-5: Tilgangsstyring dokumentert | ✅ |
| P0-6: Retention policy | ⚠️ Utkast – godkjenning mangler |
| P0-7: Avgrensning arbeidstidsregistrering | ✅ |
| P0-8: Verneombud dokumentert | ✅ |
| P0-9: Audit-logg finnes | ✅ |
| P0-10: Personvernbrudd-rutine | ✅ Utkast – godkjennes av daglig leder |
| P0-11: Innsyn/retting/sletting prosess | ✅ Utkast – gjennomgås av HR |

**Kritiske gjenstående (krever ledelsesbeslutning):**
- Inngå DPA med Supabase (EU-region: `eu-west-1` ✅), Vercel, Resend og Sentry
- Juridisk bekreftelse av behandlingsgrunnlag, særlig sykefravær (GDPR art. 9)

---

## 4. Rolle- og lokasjonstilgang

**Status: ✅ Klar (teknisk)**

| Sjekk | Status |
|---|---|
| Alle 4 roller implementert | ✅ |
| RBAC i tRPC og server components | ✅ |
| ProfileAssignment per lokasjon | ✅ |
| Verneombud per lokasjon | ✅ |
| HMS-ansvarlig per lokasjon | ✅ |

**Gjenstår (operasjonelt):**
- Opprette produksjonsbrukere med riktige roller
- Sette primærlokasjon for alle ansatte
- Verifisere at ingen testbrukere er i prod

---

## 5. Mobil / PWA

**Status: ✅ Klar**

| Sjekk | Status | Kommentar |
|---|---|---|
| Mobile-first layout | ✅ | 390px-first |
| BottomNav | ✅ | |
| Touch targets 44px | ✅ | |
| PWA installebar | ✅ | iOS Safari + Android Chrome |
| Push-varsler | ✅ | Testet |
| Offline-side | ✅ | |

---

## 6. Testdata

**Status: 🔴 Må fikses før prod-pilot**

| Sjekk | Status |
|---|---|
| Testbrukere fjernet fra prod | 🔴 Ikke verifisert (finnes kun i dev nå) |
| Seed-avvik/risiko/tiltak fjernet | 🔴 Ikke verifisert |
| Audit-logg ryddet for testhandlinger | 🔴 Ikke verifisert |

---

## 7. Dokumentasjon

**Status: ✅ Klar**

| Dokument | Status |
|---|---|
| `docs/PILOT_GUIDE.md` | ✅ |
| `docs/PILOT_EXECUTION_PLAN.md` | ✅ |
| `docs/pilot/PILOT_READINESS_CHECKLIST.md` | ✅ |
| `docs/PRIVACY_AND_GDPR.md` | ✅ |
| `docs/pilot/DPA_CHECKLIST.md` | ✅ |
| `docs/pilot/PROCESSING_BASIS_REGISTER.md` | ✅ |
| `docs/pilot/RETENTION_POLICY_DRAFT.md` | ✅ |
| `docs/pilot/PERSONAL_DATA_BREACH_PROCEDURE.md` | ✅ |
| `docs/pilot/DATA_SUBJECT_REQUEST_PROCEDURE.md` | ✅ |
| `docs/PROJECT_STATUS.md` | ✅ (dette steget) |
| `docs/ROUTES_AND_RBAC.md` | ✅ (dette steget) |

---

## 8. Support og rutiner

**Status: ⚠️ Nesten klar**

| Sjekk | Status |
|---|---|
| IT-kontaktpunkt definert | ⚠️ Mangler navn |
| HR-kontaktpunkt for brukerspørsmål | ⚠️ Mangler navn |
| Rutine for passordtilbakestilling | ✅ Via Supabase Auth |
| Rutine for ny brukeropprettelse | ⚠️ Beskrevet i docs, ikke automatisert |
| Backup Supabase | ✅ Automatisk i Supabase (verifiser i dashboard) |
| Nedetidskommunikasjon | ⚠️ Ikke definert |

---

## 9. Kjente risikoer

| Risiko | Alvorlighet | Sannsynlighet | Tiltak |
|---|---|---|---|
| DPA ikke inngått ved pilotstart | Høy | Middels | Prioriter signering umiddelbart |
| Testdata i prod | Middels | Lav | Sjekk database før pilot |
| Sentry ikke konfigurert i prod | Middels | Middels | Legg til DSN i Vercel env vars |
| Push-varsler blokkert av iOS-innstillinger | Lav | Middels | Informer pilotbrukere om å tillate varsler |
| Anonym varsling misforståes | Middels | Middels | Tydelig kommunikasjon i UI (gjort) |
| RLS ikke aktivert (Prisma BYPASSRLS) | Info | N/A | Dokumentert valg — Prisma er backend-only |

---

## 10. Go / No-Go-vurdering

### Absolutte krav (blokkerer pilot)
- [x] TypeScript: 0 feil — verifisert 2026-06-15
- [x] Build rent — verifisert 2026-06-15
- [x] Rate limiting på alle upload-endepunkter (attachment, document, contract)
- [x] Dashboard error boundary implementert
- [x] Private storage buckets: incident-attachments, documents, contracts
- [x] Signerte URLer for alle filnedlastinger
- [ ] Produksjonsmiljø satt opp (Vercel + Supabase prod) ← GJENSTÅR
- [ ] Pilotbrukere opprettet i produksjon ← GJENSTÅR
- [ ] **DPA inngått med alle leverandører** ← BLOKKERER (ledelsesbeslutning)
- [x] Avviksmodul fungerer end-to-end
- [x] Fraværsmodul fungerer end-to-end

### Akseptable mangler ved pilotstart
- Ekstern anonym varslingskanal — ikke implementert (intern varslingsmodul er tilgjengelig)
- Automatisk deaktivering ved oppsigelse — manuell prosess
- Lønnsintegrasjon — eget system, ikke i scope
- E-signering er mock/testmodus — ingen ekte BankID/Signicat (tydelig merket i UI, ikke juridisk bindende)
- Teams og externe samhandlingsintegrasjoner — ikke i scope
- Automatiske cron-varsler for utløpende opplæring/kjemikalier — P2

### Gjenstående manuelle oppgaver
- Sett opp Vercel production-prosjekt — se `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- Kjør `npx prisma migrate deploy` mot prod-database
- Opprett Storage-buckets i Supabase prod (alle private) — se `docs/STORAGE_BUCKETS.md`
- Konfigurer Sentry DSN, VAPID-nøkler, Resend i Vercel env vars
- Opprett pilotbrukere manuelt — se `docs/PRODUCTION_DATA_SETUP.md`
- Signer DPA-er — se `docs/pilot/DPA_CHECKLIST.md`
- Kjør smoke-test per rolle — se `docs/PILOT_SMOKE_TEST.md`

### Konklusjon

**⚠️ Teknisk klar — produksjonsoppsett og DPA gjenstår**

Koden er stabil. Alle moduler er implementert (28A–30B), typecheck og build er grønne, rate limiting og error boundaries er på plass. Neste steg er produksjonsoppsett og DPA-signering.

---

*Sist oppdatert: 2026-06-15*
