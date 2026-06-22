# Truls HR — Prosjektoppsummering

## Hva er dette?
En fullstack HR/HMS PWA-app bygget med Next.js 14 (App Router), TypeScript, tRPC v11, Prisma og Supabase (PostgreSQL). Deployet på Vercel. Støtter roller: ADMIN, HR, MANAGER, EMPLOYEE.

---

## Tech-stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Next.js 14 App Router, React, Tailwind CSS |
| API | tRPC v11 (type-safe end-to-end) |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Auth | Supabase Auth (SSR cookies, PKCE) |
| Deploy | Vercel |
| PWA | next-pwa, Web Push API |
| AI-assistent | Claude Sonnet (regelbasert + Anthropic API) |

---

## Funksjoner bygget

### Brukerhåndtering & Auth
- Roller: ADMIN, HR, MANAGER, EMPLOYEE med RBAC på alle ruter og tRPC-prosedyrer
- Supabase SSR-auth med middleware og `/auth/callback`-rute
- **Testbruker-switcher**: Admin kan bytte mellom testbrukere uten å logge ut/inn manuelt (via Supabase admin magic link + cookie-sletting)

### Dashboard
- Personalisert dashboard per rolle (ansatt vs. admin/leder)
- Avrundet hero-banner med hilsen, dato, global søkebar og snarveier
  - Ansatt: Egenmelding, Meld fravær, Min profil
  - Admin/HR/Manager: Nytt avvik, Ansatte, Godkjenn overtid, Rapporter
- Fraværssaldokort (Egenmelding, Omsorgsfravær, Ferie) med progress-bar
- Mørk sidebar med sage-grønn bakgrunn, seksjonsoverskrifter og sammenleggbare grupper

### HMS-moduler
- **Avvik**: registrering, tildeling, statussporing, lukking
- **HMS-runde / Vernerunde**: sjekkliste-basert med aktivitetsfeed
- **Risikovurdering**: skjema med sannsynlighet × konsekvens-matrise
- **Tiltak**: kobling mot avvik og risiko
- **Stoffkartotek**: kjemikaliehåndtering
- **Avvik-eskalering (automatisk)**: cron-jobb varsler leder etter 7 dager, HR etter 14 dager, admin etter 21 dager med dedup via `SentAlert`-tabell

### Personal & Fravær
- **Ansattoversikt**: kortvisning med chip-filtre og lokasjon
- **Min profil**: for alle ansatte — kontaktinfo, kontrakter, opplæring
- **Kollegaer-side**: teamvisning per avdeling, tilgjengelig for alle
- **Fraværshåndtering**: søknad, godkjenning, kalender
  - Egenmelding auto-godkjennes
  - Omsorgsfravær og feriesøknader til godkjenning
  - Saldovisning: egenmeldinger brukt/totalt, omsorgsfravær, feriedager
- **Sykefraværsoppfølging**: 4-ukers plan, statistikk per avdeling
- **Overtid**: registrering og godkjenning med dedikert oversiktsside
- **Medarbeidersamtaler**: skjema og historikk
- **Kontrakter**: opplasting, statussporing, varsel ved utløp

### Opplæring & Kompetanse
- **Opplæringsmodul**: kurs per ansatt på profil
- **Kompetansematrise**: tRPC `training.matrix`-endpoint, tabell med status (ok/utløpende/utløpt/mangler), avdelingsfilter, obligatorisk-filter, CSV-eksport

### Automatiske varsler (cron `/api/cron/alerts`)
1. Prøvetid utløper innen 14 dager → varsler HR/ADMIN
2. Kurssertifikat utløper innen 30 dager → varsler ansatt
3. Bursdager i dag → varsler HR/ADMIN
4. Kontrakter utløper innen 60 dager → varsler HR/ADMIN
5. Vernerunde ikke gjennomført (Oktober) → varsler HR/ADMIN
6. Mars: påminnelse om å søke sommerferie (Ferieloven §6)
7. Mai: ansatte uten godkjent sommerferie → varsel
8. Avvik-eskalering: 7d → leder, 14d → HR, 21d → admin

### AI-assistent "Truls"
- Flytende knapp, panel-widget
- Regelbasert veiledning (ingen ekstern API nødvendig i basisversjonen)
- Koblet mot interne lenker, håndbøker og HMS-rutiner
- Starter-spørsmål og kilde-visning

### Design & UX
- **3 paletter**: sage (primær), ocean, moss — bytting live via `data-palette`-attributt
- **Lys/mørk/system-modus** med next-themes
- **PWA**: installerbar på mobil og desktop, service worker, offline-støtte
- **Push-varsler**: godkjenning av fravær og overtid
- **Global søk**: søk etter ansatte, avvik, dokumenter fra sidebar og hero
- **BottomNav** på mobil, mørk sidebar på desktop

---

## Database-modeller (utvalg)

```
Profile (ansatt), Department, Location, ProfileAssignment
Incident (avvik), IncidentComment, IncidentAttachment
InspectionRecord (HMS-runde), RiskAssessment, Measure
LeaveRequest, OvertimeRequest
Contract, TrainingRecord, TrainingCourse
Notification, SentAlert (dedup)
PersonnelCase, EmployeeInterview, Announcement
ChemicalProduct, Document
```

### Nye AlertType-verdier (manuell SQL-migrering i Supabase)
```sql
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'INCIDENT_OVERDUE_7D';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'INCIDENT_OVERDUE_14D';
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'INCIDENT_OVERDUE_21D';
```

---

## Viktige filer

| Fil | Hva |
|-----|-----|
| `app/(dashboard)/layout.tsx` | Hoved-layout med sidebar, topbar, BottomNav |
| `components/layout/Sidebar.tsx` | Mørk grønn sidebar med grupper og roller |
| `components/layout/TopBar.tsx` | Topbar med testbruker-switcher for ADMIN |
| `features/dashboard/DashboardGreeting.tsx` | Hero-banner med hilsen, søk og snarveier |
| `features/leave/LeaveBalanceCards.tsx` | Fraværssaldokort (3 kolonner) |
| `features/dev/TestUserSwitcher.tsx` | Dropdown for å bytte testbruker (kun ADMIN) |
| `app/api/dev/impersonate/route.ts` | API-rute for brukerbytte via magic link |
| `app/api/cron/alerts/route.ts` | Alle automatiske varsler (8 seksjoner) |
| `features/training/CompetencyMatrix.tsx` | Kompetansematrise med filter og CSV |
| `app/(dashboard)/opplaering/matrise/page.tsx` | Kompetansematrise-side |
| `components/assistant/AssistantWidget.tsx` | Truls-assistent widget |
| `app/globals.css` | CSS-variabler for paletter og tema |
| `prisma/schema.prisma` | Full dataskjema |

---

## Supabase-konfigurasjon (må settes manuelt)

- **Site URL**: `https://hr-hms-fuvkodkrg-larshenrik-9900s-projects.vercel.app`
- **Redirect URLs**: `https://hr-hms-fuvkodkrg-larshenrik-9900s-projects.vercel.app/auth/callback`

---

## Mulige neste steg

- [ ] Lønnshåndtering (import fra lønnssystem, lønnsslipp)
- [ ] Fraværskalender forbedret (teamvisning per uke)
- [ ] Rapportgenerering (PDF-eksport)
- [ ] Onboarding-flyt for nye ansatte
- [ ] E-postvarsler i tillegg til push
- [ ] Mobil-optimalisering av kompetansematrise
- [ ] GDPR-forespørsler automatisering
