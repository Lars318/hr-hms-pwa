# Prosjektstatus – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> **Sist oppdatert:** Etter Steg 25A  
> **Stack:** Next.js 14 App Router · TypeScript · tRPC v11 · Prisma v5 · PostgreSQL (Supabase) · Supabase Auth · shadcn/ui · Tailwind · PWA (next-pwa) · Resend · Web Push · Sentry · Vercel

---

## 1. Teknisk plattform

**Status:** ✅ Ferdig

- Next.js 14 App Router med Server Components og Client Components
- TypeScript gjennomgående, 0 typefeil ved siste sjekk
- tRPC v11 med `httpBatchLink` og `superjson`
- Prisma v5.22.0 — 26 modeller, 16 enums
- Supabase: PostgreSQL + Auth (SSR cookies via `@supabase/ssr`) + Storage
- Prisma kobler som postgres superuser (BYPASSRLS=TRUE) — alle Prisma-queries bypasser RLS
- shadcn/ui komponenter (Radix UI + Tailwind)
- PWA med next-pwa v5.6.0 + Workbox (kjent: `fallbacks` fjernet pga. Next.js 14-bug)
- Sentry feillogging
- Vercel deployment

**Viktige filer:**
- `prisma/schema.prisma` — komplett datamodell
- `server/trpc/trpc.ts` — procedure-typer (public, protected, profile, hr, admin)
- `next.config.mjs` — PWA-konfig

---

## 2. Auth og roller

**Status:** ✅ Ferdig

- Supabase Auth med SSR (cookies)
- 4 roller: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`
- Profile-modell kobler Supabase-bruker til appbrukerprofil
- HMS-deteksjon: HR med "hms" i title får HMS-fokusert dashboard
- Rate limiting på sensitive endepunkter (`lib/security/rateLimit.ts`)
- Middleware sjekker auth på alle beskyttede ruter

**Viktige filer:**
- `app/(auth)/login/page.tsx`
- `middleware.ts`
- `lib/supabase/server.ts` og `client.ts`
- `server/trpc/context.ts`

**Kjente begrensninger:**
- Ingen MFA
- Ingen SSO/SAML
- Passordtilbakestilling via Supabase Auth (ikke bygget inn i app-UI)

---

## 3. Ansattregister

**Status:** ✅ Ferdig

- `Profile`-modell: fullName, email, title, phone, avatarUrl, role, status, employedAt, terminatedAt
- Avdelingstilknytning (departmentId — bakoverkompatibel, ikke primær)
- CRUD for ADMIN/HR
- Filtrering, søk, rolle-tildeling
- Avatar-opplasting via Supabase Storage med signerte URLer

**Viktige filer:**
- `app/(dashboard)/ansatte/`
- `features/employees/`
- `server/routers/profile.ts`

**Kjente begrensninger:**
- Ingen automatisk deaktivering ved oppsigelse (P1)
- Ingen onboarding-sjekkliste
- Ingen stillingsbeskrivelse-modul

---

## 4. Lokasjoner og tilhørigheter

**Status:** ✅ Ferdig

- `Location`-modell som primær org-enhet (ikke Department)
- `ProfileAssignment`-modell: ansatt ↔ lokasjon med `isPrimary`-flagg
- Ansatt kan tilhøre flere lokasjoner
- CRUD for lokasjoner

**Viktige filer:**
- `app/(dashboard)/lokasjoner/`
- `features/locations/`
- `server/routers/location.ts`, `profileAssignment.ts`

---

## 5. HMS-organisering / Verneombud

**Status:** ✅ Ferdig

- `safetyRepresentativeId` og `hseManagerId` per `Location`
- Verneombud og HMS-ansvarlig kan settes per treningssenter
- `createNotificationsForLocation()` ruter varsler til verneombud + HMS-ansvarlig

**Kjente begrensninger:**
- Ingen historikk over verneombudsvalg (P2-4)
- Ingen HMS-opplæringsregister (P1)
- Ingen AMU (ikke i scope)
- Ingen BHT (ikke i scope)

---

## 6. Avvik

**Status:** ✅ Ferdig

- `Incident`-modell: title, description, severity (LOW/MEDIUM/HIGH/CRITICAL), status (OPEN/IN_PROGRESS/RESOLVED/CLOSED), occurredAt, dueDate
- RBAC: EMPLOYEE ser egne, MANAGER ser avdeling, HR/ADMIN ser alle
- Vedlegg via Supabase Storage (signerte URLer)
- Audit-logg per avvik
- Notifikasjoner ved opprettelse, tildeling og statusendring

**Viktige filer:**
- `app/(dashboard)/avvik/`
- `features/incidents/`
- `server/routers/incident.ts`

---

## 7. Risiko

**Status:** ✅ Ferdig

- `RiskAssessment`-modell (vurderinger) + `RiskItem`-modell (risikopunkter)
- Status: DRAFT/ACTIVE/REVIEW/CLOSED
- RiskLevel: LOW/MEDIUM/HIGH/CRITICAL
- Knyttet til lokasjon og avdeling
- Risikopunkter kan gi opphav til tiltak

**Viktige filer:**
- `app/(dashboard)/risiko/`
- `features/risk/`
- `server/routers/riskAssessment.ts`, `riskItem.ts`

---

## 8. Tiltak

**Status:** ✅ Ferdig

- `Action`-modell: title, description, priority, status (OPEN/IN_PROGRESS/DONE/CANCELLED), dueDate
- Kilde: RISK_ITEM, INCIDENT eller MANUAL
- Tildeling til ansatt
- RBAC: EMPLOYEE ser egne tiltak
- Audit-logg og varsler

**Viktige filer:**
- `app/(dashboard)/tiltak/`
- `features/actions/`
- `server/routers/action.ts`

**Kjente begrensninger:**
- Ingen automatisk purring ved forfalt frist (P1-8)

---

## 9. Dokumenter

**Status:** ✅ Ferdig

- `Document`-modell: title, category, visibility, expiresAt
- Kategorier: POLICY, PROCEDURE, INSTRUCTION, CHECKLIST, TEMPLATE, HMS, HR, OTHER
- Synlighet: PUBLIC/PRIVATE
- Vedlegg i Supabase Storage (private bucket, signerte URLer)
- `DocumentReadConfirmation` — lesebekreftelse per ansatt
- Utløpsdato og varsler for utløpende dokumenter

**Viktige filer:**
- `app/(dashboard)/dokumenter/`
- `features/documents/`
- `server/routers/document.ts`

---

## 10. Personalhåndbok

**Status:** ✅ Ferdig

- `HandbookCategory`, `HandbookSection`, `HandbookVersion`, `HandbookAcknowledgement`
- Versjonshåndtering med publisering
- Ansatte bekrefter lest
- Admin-panel for redigering av kategorier og seksjoner

**Viktige filer:**
- `app/(dashboard)/personalhandbok/`
- `features/handbook/`
- `server/routers/handbook.ts`

---

## 11. Fravær

**Status:** ✅ Ferdig

- `LeaveRequest`-modell: type (VACATION/SICK_LEAVE/CARE_LEAVE/PARENTAL_LEAVE/UNPAID_LEAVE/OTHER), status (PENDING/APPROVED/REJECTED/CANCELLED)
- Godkjenningsflyt: ansatt → leder/HR
- Kalendervisning for fraværsoversikt
- Varsler til leder og ansatt

**Viktige filer:**
- `app/(dashboard)/fravaer/`
- `features/leave/`
- `server/routers/leaveRequest.ts`

**Kjente begrensninger:**
- Ingen fullstendig arbeidstidsregistrering (ikke i scope — kun fravær og overtid)
- Ingen AMU-kobling (ikke i scope)
- Ingen langtidsfraværsoppfølging (4-/8-ukers påminnelse) (P1-9)

---

## 12. Overtid og timebank

**Status:** ✅ Ferdig

- `OvertimeEntry`-modell: type (OVERTIME/TIME_OFF/ON_CALL/TRAVEL_TIME), status (DRAFT/SUBMITTED/APPROVED/REJECTED/CANCELLED)
- `TimeBankAdjustment` for HR-korreksjoner
- Saldo = godkjente timer inn - TIME_OFF ut + justeringer
- Godkjenningsflyt: ansatt → leder/HR
- Auto-tildeling av primærlokasjon

**Viktige filer:**
- `app/(dashboard)/overtid/`
- `features/overtime/`
- `server/routers/overtime.ts`

**Kjente begrensninger:**
- Ingen automatisk grensevarsel (Aml §10-6 max 10t/dag, 300t/år) (P2-6)

---

## 13. Varsling om kritikkverdige forhold

**Status:** ✅ Ferdig (Steg 25A)

- `WhistleblowingCase`, `WhistleblowingMessage`, `WhistleblowingAuditLog`
- Kategorier: HARASSMENT, DISCRIMINATION, SAFETY, FINANCIAL_MISCONDUCT, ETHICS, RETALIATION, OTHER
- Status: RECEIVED, UNDER_REVIEW, INVESTIGATING, ACTION_REQUIRED, CLOSED, REJECTED
- Strengt RBAC: EMPLOYEE ser egne, MANAGER kun tildelte, HR/ADMIN ser alle
- Anonym-flagg: navn skjules i saksbildet, men tekniske logger kan finnes
- Nøytrale varsler (ingen beskrivelse i notifikasjon)
- Audit-logg per hendelse
- Informasjonsside med juridisk forklaring om Aml §2A

**Viktige filer:**
- `app/(dashboard)/varsling/`
- `features/whistleblowing/`
- `server/routers/whistleblowing.ts`

**Kjente begrensninger:**
- Ingen ekstern anonym varslingskanal
- Ingen eksport-rapport for HR (P1)

---

---

## 13B. HMS-opplæringsregister

**Status:** ✅ Ferdig (Steg 27A)

- `TrainingCourse`, `TrainingRecord`, `TrainingAuditLog`
- Kategori, obligatorisk/valgfri, gyldighetsperiode, utløpsdato
- RBAC: HR/ADMIN administrerer kurs, MANAGER registrerer for sine, EMPLOYEE ser egne
- Ansattvisning: `/opplaering/mine` — egne records + manglende obligatoriske
- Admin: `/opplaering/admin` — filter på kurs/lokasjon/status, registrer/slett records
- Kursdetalj: statistikk (gyldige/utløpende/utløpt/totalt) + gjennomføringsliste
- Rapport: «Opplæring» lagt til i rapportmodulen med CSV-eksport
- Varsler: `TRAINING_EXPIRING_SOON` og `TRAINING_OVERDUE` i notification-systemet
- Navigasjon: Sidebar + BottomNav oppdatert
- Dashboard-snarveier i HR- og Admin-dashboard

**Viktige filer:**
- `app/(dashboard)/opplaering/`
- `features/training/`
- `server/routers/training.ts`
- `lib/reports/queries.ts` (queryTraining)

**Kjente begrensninger:**
- Ingen automatisk varslings-cron for utløpende opplæring (P2 — kan legges til med scheduled job)
- MANAGER ser kun egne ansattes records via adminvisning (ikke via kursdetalj)

---

## 13C. Stoffkartotek/kjemikalier

**Status:** ✅ Ferdig (Steg 27B)

- `Chemical`, `ChemicalAuditLog` — kjemikalie-register med HMS-data, faremerking, verneutstyr, SDS-referanse, datoer
- RBAC: HR/ADMIN full CRUD, MANAGER/EMPLOYEE leser (lokasjonfiltrert for ikke-HR)
- Oversiktsside med status-indikatorer (utløpt/utløper snart/OK)
- Detaljside med faremerking, HMS-info, SDS-lenke, audit-logg
- Opprett/rediger-skjema med faremerking-velger
- Rapport «Stoffkartotek» med CSV-eksport
- Navigasjon: Sidebar + BottomNav oppdatert
- NotificationType: `CHEMICAL_REVIEW_DUE`

**Viktige filer:**
- `app/(dashboard)/kjemikalier/`
- `features/chemicals/`
- `server/routers/chemical.ts`

**Kjente begrensninger:**
- SDS-fil-upload ikke implementert (v1 bruker tekst-URL/referanse)
- Ingen automatisk varslings-cron for utløpende kjemikalier (kan legges til med scheduled job)

---

## 13D. GDPR datainnsyn/self-service eksport

**Status:** ✅ Ferdig (Steg 27C)

- `DataSubjectRequest`-modell med `DataRequestType` (ACCESS, PORTABILITY, RECTIFICATION, ERASURE, OTHER) og `DataRequestStatus` (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
- tRPC-router `dataRequest` med 5 prosedyrer: `mine`, `list`, `create`, `updateStatus`, `openCount`
- Ansatt-side: `/personvern/mine-foresporsler` — send og følg forespørsler
- HR/Admin-side: `/personvern/foresporsler` — liste med statusfilter, klikk for detalj
- HR/Admin-detaljside: `/personvern/foresporsler/[id]` — oppdater status og legg til merknad
- Varsler: `DATA_REQUEST_RECEIVED` (til HR/ADMIN), `DATA_REQUEST_COMPLETED` (til ansatt)
- Personvernsiden oppdatert med lenker til forespørselssider
- Sidebar: «GDPR-forespørsler» lagt til for HR/ADMIN

**Viktige filer:**
- `app/(dashboard)/personvern/mine-foresporsler/page.tsx`
- `app/(dashboard)/personvern/foresporsler/page.tsx`
- `app/(dashboard)/personvern/foresporsler/[id]/page.tsx`
- `features/data-requests/`
- `server/routers/dataRequest.ts`

---

## 14. Varsler / Notifications

**Status:** ✅ Ferdig

- `Notification`-modell: type, title, message, linkUrl, isRead
- `NotificationType`: 19 typer inkl. WHISTLEBLOWING_RECEIVED
- In-app varsler med bell-ikon og lespunkt
- E-postvarsler via Resend
- Web Push via VAPID (iOS/Android)
- `PushSubscription`-modell
- Helpers: `createNotification`, `createNotificationsForRoles`, `createNotificationsForLocation`

**Viktige filer:**
- `app/(dashboard)/varsler/`
- `features/notifications/`
- `server/routers/notification.ts`, `push.ts`
- `lib/notifications.ts`
- `lib/push/sendPushNotification.ts`

---

## 15. Rapporter

**Status:** ✅ Ferdig

- CSV-eksport for: avvik, risikovurderinger, tiltak, fravær, overtid
- Filtrering per periode og lokasjon
- Kun ADMIN/HR/MANAGER

**Viktige filer:**
- `app/(dashboard)/rapporter/`
- `features/reports/`
- `server/routers/report.ts`

---

## 16. Dashboards

**Status:** ✅ Ferdig

- 5 rollebaserte dashboards: EMPLOYEE, MANAGER, HR, HMS, ADMIN
- HMS-deteksjon: HR med "hms" i tittel → HMS-fokusert dashboard
- Nøkkeltall, snarveier, todo-seksjon, siste saker
- `dashboard.summary` tRPC-router samler data per rolle

**Viktige filer:**
- `app/(dashboard)/dashboard/`
- `features/dashboard/`
- `server/routers/dashboard.ts`

---

## 17. Mobil / PWA

**Status:** ✅ Ferdig (med kjente begrensninger)

- Mobile-first design (390px-first)
- BottomNav (lg:hidden) + Sidebar (hidden lg:flex)
- Min touch target: 44px
- PWA med `next-pwa`, Service Worker, manifest
- Push-varsler testet på iOS/Android
- Offline-side vises ved manglende nett

**Kjente begrensninger:**
- `fallbacks`-konfig fjernet pga. next-pwa@5.6.0 + Next.js 14-bug
- Ingen offline data-synk (kun lesing av cachet innhold)
- PWA install prompt varierer mellom iOS/Android/nettleser

---

## 18. Compliance / GDPR

**Status:** ✅ Teknisk dokumentasjon ferdig / ⚠️ Juridisk godkjenning gjenstår

- `/personvern` — ansatt-vendt personvernside
- `/admin/compliance` — P0-tracker (8/11 = 73%)
- `docs/COMPLIANCE_GAP_ANALYSIS.md` — 23-punkts gap-tabell
- `docs/COMPLIANCE_BACKLOG.md` — P0/P1/P2-backlog
- `docs/PRIVACY_AND_GDPR.md` — behandlingsgrunnlag, databehandlere, lagringstid
- `docs/pilot/` — 6 pilot-dokumenter (DPA-sjekkliste, behandlingsgrunnlagsregister, retention policy, personvernbrudd-rutine, rettighetsforespørsel-prosedyre, pilot readiness checklist)

**Gjenstår (krever ledelsesbeslutning):**
- DPA med Supabase, Vercel, Resend, Sentry
- Juridisk bekreftelse av behandlingsgrunnlag
- Godkjenning av retention policy
- Fylle ut kontaktpersoner i breach-rutinen

---

## 19. Drift / Observability

**Status:** ✅ Ferdig (grunnleggende)

- Sentry feillogging via `@sentry/nextjs`
- `/admin/system` — systemstatus-side (ADMIN)
- `AuditLog`-modell for sporbarhet (avvik, risiko, varsling m.m.)
- Rate limiting på upload-endepunkter

**Kjente begrensninger:**
- Ingen alerting/oncall-konfig i Sentry
- Ingen Vercel-spesifik overvåking oppsatt
- Ingen backup/restore-prosedyre testet

---

## 20. Pilot / Staging

**Status:** ⚠️ Nesten klar

- Eksisterende pilot-dokumenter i `docs/pilot/`
- `docs/PILOT_READINESS_CHECKLIST.md` — go/no-go-sjekkliste
- `docs/PILOT_GUIDE.md` og `docs/PILOT_EXECUTION_PLAN.md`
- Testbrukere finnes i dev-miljø

**Gjenstår:**
- Produksjonsmiljø på Vercel med prod-Supabase (ikke dev)
- Fjerne testdata fra prod
- DPA-er signert
- Seed-data ryddet

---

---

## 21. Onboarding/offboarding (Steg 28A)

**Status:** ✅ Ferdig

- `OnboardingTemplate`, `OnboardingTemplateTask`, `OnboardingProcess`, `OnboardingTask`
- Prosesstyper: ONBOARDING, OFFBOARDING
- RBAC: HR/ADMIN oppretter maler og prosesser; EMPLOYEE fullfører egne oppgaver
- Varsler: `ONBOARDING_TASK_ASSIGNED`, `OFFBOARDING_TASK_ASSIGNED`, `ONBOARDING_COMPLETED`, `OFFBOARDING_COMPLETED`

---

## 22. Medarbeidersamtaler (Steg 28B)

**Status:** ✅ Ferdig

- `EmployeeReview` med `managerNotes String? @db.Text` — sensitiv, aldri returnert til EMPLOYEE
- Status: SCHEDULED, COMPLETED, CANCELLED
- RBAC: EMPLOYEE kan oppdatere `sharedNotes`; MANAGER/HR kan oppdatere `managerNotes`; kun HR/ADMIN kan endre status
- Varsler: `REVIEW_SCHEDULED`, `REVIEW_COMPLETED`

**Sensitive felt:** `managerNotes` returneres som `null` for EMPLOYEE i `byId`-prosedyre.

---

## 23. Advarsler / Personalsaker (Steg 28C)

**Status:** ✅ Ferdig

- `PersonnelCase` med `internalNote String? @db.Text` — aldri vist til EMPLOYEE eller MANAGER
- Typer: WARNING, PERFORMANCE_PLAN, TERMINATION_NOTICE, SUSPENSION, OTHER
- Status: OPEN, CLOSED, ARCHIVED
- `PersonnelCaseAuditLog` på alle statusendringer
- RBAC: EMPLOYEE → FORBIDDEN; MANAGER → ser sak, men `internalNote: null`; HR/ADMIN → full tilgang

**Sensitive felt:** `internalNote` returneres alltid som `null` for MANAGER og EMPLOYEE.

---

## 24. Kommentarer på saker (Steg 29A)

**Status:** ✅ Ferdig

- `Comment` med `isInternal Boolean @default(false)`
- Entitetstyper: INCIDENT, ACTION, RISK_ASSESSMENT
- Interne kommentarer (`isInternal: true`) vises kun for ADMIN/HR/MANAGER
- RBAC: kun privilegerte roller kan sette `isInternal: true`
- **Ikke lagt til på:** varslingssaker, personalsaker, medarbeidersamtaler

---

## 25. Kontrakter (Steg 30A)

**Status:** ✅ Ferdig

- `Contract` med `fileKey`, `sharedWithEmployee Boolean @default(false)`, `sharedAt`
- Typer: EMPLOYMENT, AMENDMENT, TERMINATION, OTHER
- **Lagring:** privat bucket `contracts` — alle filer via signerte URLer (300 sek utløp)
- Totrinnsdeling: HR laster opp → HR klikker "Del" → EMPLOYEE ser kontrakt
- RBAC: EMPLOYEE ser KUN kontrakter med `sharedWithEmployee=true`

---

## 26. E-signering mock (Steg 30B)

**Status:** ✅ Ferdig — TESTMODUS / MOCK

> ⚠️ **VIKTIG:** E-signeringen er en mock/simulator. Det finnes INGEN integrasjon med BankID, Signicat, eller andre ekte e-signeringstjenester. Signaturer produsert i dette systemet er IKKE juridisk bindende. Dette er utelukkende en teknisk mock for å vise flyten.

- `SignatureRequest` knyttet til `Contract` og `Profile`
- Provider-interface `SigningProvider` i `lib/esignering/provider.ts` — kan byttes ut med ekte leverandør
- `mockAdapter.ts` returnerer dummy `externalId`, aldri ekte signatur
- UI viser tydelig "(testmodus — ingen ekte signatur)" i alle signeringsvisninger
- Varsler: `SIGNATURE_REQUESTED`, `SIGNATURE_COMPLETED`

**For å bytte til ekte e-signering:** Implementer `SigningProvider`-interfacet og bytt ut `mockSigningProvider`. Krever ny DPIA og DPA med e-signeringsleverandør.

---

*Sist oppdatert: 2026-06-15*
