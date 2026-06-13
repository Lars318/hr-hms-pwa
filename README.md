# HR/HMS PWA

Intern HR- og HMS-løsning bygget som Progressive Web App.

## Stack

| Lag | Teknologi |
|-----|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| API | tRPC + React Query |
| Auth | Supabase Auth |
| Database | PostgreSQL via Supabase + Prisma ORM |
| Lagring | Supabase Storage |
| PWA | next-pwa / Workbox |
| E-post | Resend |
| Deploy | Vercel (anbefalt) |

## Lokal oppsett

### 1. Klon og installer

```bash
git clone <repo-url>
cd hr-hms-pwa
npm install
```

### 2. Supabase-prosjekt

1. Opprett prosjekt på [supabase.com](https://supabase.com)
2. Gå til **Settings → API** og kopier:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Gå til **Settings → Database → Connection string** (Transaction pooler) og kopier til `DATABASE_URL`
4. Kopier Session pooler-string til `DIRECT_URL`

### 3. Miljøvariabler

```bash
cp .env.example .env.local
# Fyll inn verdiene fra Supabase
```

### 4. Supabase Auth-innstillinger

I Supabase-dashboardet:
- **Authentication → Providers**: E-post/passord er aktivert som standard
- **Authentication → URL Configuration**:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Databasemigrering

```bash
npm run db:push        # Synkroniserer schema mot Supabase
npm run db:generate    # Genererer Prisma Client
```

### 6. Start dev-server

```bash
npm run dev
# Åpne http://localhost:3000
```

### 7. Opprett første bruker

1. Gå til Supabase-dashboardet → **Authentication → Users** → **Add user**
2. Logg inn på `http://localhost:3000/login`
3. Opprett tilhørende `Profile`-rad manuelt via Prisma Studio:

```bash
npm run db:studio
```

## Prosjektstruktur

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Innloggingsside
│   │   └── auth/callback/route.ts  # OAuth-callback
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Beskyttet layout med sidebar
│   │   └── dashboard/page.tsx      # Dashboardside
│   ├── api/trpc/[trpc]/route.ts    # tRPC handler
│   ├── layout.tsx                  # Root layout + TrpcProvider
│   └── page.tsx                    # Redirect → /dashboard
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/                         # shadcn/ui-komponenter
├── features/
│   └── auth/
│       └── LoginForm.tsx
├── lib/
│   ├── db.ts                       # Prisma singleton
│   ├── utils.ts                    # cn() helper
│   ├── supabase/
│   │   ├── client.ts               # Browser-klient
│   │   ├── server.ts               # Server-klient (RSC/API)
│   │   └── middleware.ts           # Auth-middleware hjelper
│   └── trpc/
│       ├── client.ts               # tRPC React-klient
│       └── provider.tsx            # TrpcProvider
├── server/
│   ├── trpc/
│   │   ├── context.ts              # Request-kontekst (user + profile)
│   │   └── trpc.ts                 # Prosedyre-builder + middleware
│   └── routers/
│       ├── _app.ts                 # Root router
│       └── profile.ts              # Profil-endepunkter
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   └── icons/
├── middleware.ts                   # Auth-guard for alle ruter
└── next.config.mjs
```

## Tilgjengelige scripts

```bash
npm run dev          # Start utviklingsserver
npm run build        # Produksjonsbygg
npm run db:push      # Push Prisma schema → database
npm run db:studio    # Åpne Prisma Studio
npm run db:generate  # Generer Prisma Client
```

## Ruter

| Rute | Tilgang | Beskrivelse |
|------|---------|-------------|
| `/dashboard` | Alle | Startside |
| `/ansatte` | ADMIN, HR | Liste over alle ansatte |
| `/ansatte/ny` | ADMIN, HR | Opprett ny ansattprofil |
| `/ansatte/[id]` | ADMIN, HR + egen profil | Ansattdetaljer |
| `/ansatte/[id]/rediger` | ADMIN, HR | Rediger ansatt |
| `/admin/avdelinger` | ADMIN, HR | Avdelingsadministrasjon |
| `/avvik` | Alle innloggede | Liste (filtrert etter rolle) |
| `/avvik/ny` | Alle innloggede | Rapporter nytt avvik |
| `/avvik/[id]` | Se RBAC-regler | Avviksdetaljer + historikk |
| `/avvik/[id]/rediger` | Se RBAC-regler | Rediger avvik |
| `/dokumenter` | Alle innloggede | Dokumentarkiv (liste) |
| `/dokumenter/ny` | ADMIN, HR | Last opp nytt dokument |
| `/dokumenter/[id]` | Se synlighetsregler | Dokumentdetaljer + nedlasting + lesebekreftelse |
| `/dokumenter/[id]/rediger` | ADMIN, HR | Rediger dokument/last opp ny versjon |
| `/risiko` | ADMIN, HR, MANAGER | Liste risikovurderinger |
| `/risiko/ny` | ADMIN, HR, MANAGER | Opprett risikovurdering |
| `/risiko/[id]` | Se tilgangsregler | Detaljer, risikopunkter og tiltak |
| `/risiko/[id]/rediger` | ADMIN, HR, MANAGER (egen avd.) | Rediger risikovurdering |
| `/tiltak` | Alle innloggede | Tiltaksoversikt (filtrert etter rolle) |
| `/tiltak/[id]` | Se tilgangsregler | Tiltak detaljer + statusendring |
| `/varsler` | Alle innloggede | Varselsenter |
| `/fravaer` | Alle innloggede | Fraværssøknader (filtrert etter rolle) |
| `/fravaer/ny` | Alle innloggede | Ny fraværssøknad |
| `/fravaer/[id]` | Se RBAC-regler | Søknadsdetaljer + godkjenn/avslå |
| `/fravaer/[id]/rediger` | Eier (PENDING) + HR/ADMIN | Rediger søknad |
| `/fravaer/kalender` | Alle innloggede | Fraværskalender – måneds- og årsoversikt |
| `/rapporter` | MANAGER, HR, ADMIN | Rapporter og CSV-eksport |
| `/api/reports/csv` | MANAGER, HR, ADMIN | CSV-nedlasting (GET med query params) |
| `/ingen-tilgang` | Alle | Vises ved uautorisert tilgang |

## Byggesteg (veikart)

| Steg | Modul | Status |
|------|-------|--------|
| 1 | Fundament: Auth, layout, Prisma, tRPC | ✅ Ferdig |
| 2 | Ansattregister + avdelinger + RBAC | ✅ Ferdig |
| 3 | Avviksregistrering (HMS) + AuditLog | ✅ Ferdig |
| 4 | Vedlegg til avvik (Supabase Storage) | ✅ Ferdig |
| 5 | Dokumentarkiv med versjonshåndtering | ✅ Ferdig |
| 6 | Risikovurderinger med risikopunkter og tiltak | ✅ Ferdig |
| 7 | Operativt dashboard (rollebasert) | ✅ Ferdig |
| 8 | Varslingssystem (in-app) | ✅ Ferdig |
| 9 | PWA/offline-støtte (manifest, service worker, offline-kladd) | ✅ Ferdig |
| 9.5 | Stabilisering: TypeScript-fiks, RBAC-sjekk, PWA-sikkerhet | ✅ Ferdig |
| 10 | Fravær og permisjonssøknader | ✅ Ferdig |
| 11A | E-postvarsler med Resend | ✅ Ferdig |
| 12 | Fraværskalender (måned + år) | ✅ Ferdig |
| 13 | Rapporter og CSV-eksport | ✅ Ferdig |
| 14 | Produksjonsklar sikkerhetsgjennomgang | ✅ Ferdig |
| 15 | Web Push-varsler (VAPID) | ✅ Ferdig |
| 16A | Produksjonsdeploy-guide (Vercel + Supabase) | ✅ Ferdig |
| 16B | Backup/restore og driftsrutiner | ✅ Ferdig |
| 17A | Observabilitet: Sentry, logging, health, systemside | ✅ Ferdig |
| 17B | Staging-miljø og release-flyt | ✅ Ferdig |
| 18A | Brukertesting/UAT-pakke | ✅ Ferdig |
| 18B | Supabase RLS-design og implementeringsplan | ✅ Ferdig |
| 19 | Pilotgjennomføring og produksjonsklar lansering | ✅ Ferdig |

## Supabase Storage – oppsett (Steg 4)

### Opprett bucket manuelt

1. Gå til **Supabase-dashboardet → Storage**
2. Klikk **New bucket**
3. Navn: `incident-attachments`
4. **Public bucket**: **NEI** (huk av for privat)
5. Klikk **Save**

### Bucket-policy (RLS)

Bucket er privat. All tilgang skjer via signerte URL-er generert server-side med service role-nøkkelen. Ingen ekstra RLS-regler er nødvendig.

### Tillatte filtyper og størrelse

| Filtype | MIME-type |
|---------|-----------|
| PDF | `application/pdf` |
| PNG | `image/png` |
| JPG/JPEG | `image/jpeg` |
| WEBP | `image/webp` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

Maks filstørrelse: **10 MB**

### Filsti i bucket

```
incidents/{incidentId}/{attachmentId}-{sanitizedFileName}
```

### Test opplasting og nedlasting

```bash
# 1. Kontroller at .env.local har SUPABASE_SERVICE_ROLE_KEY satt
# 2. Gå til /avvik/[id] for et eksisterende avvik
# 3. Last opp en PDF i "Vedlegg"-seksjonen
# 4. Klikk nedlastingsknappen – en signert URL åpnes i ny fane
# 5. Verifiser i Supabase → Storage → incident-attachments at filen ligger der
```

## Supabase Storage – oppsett (Steg 5: documents-bucket)

### Opprett bucket manuelt

1. Gå til **Supabase-dashboardet → Storage**
2. Klikk **New bucket**
3. Navn: `documents`
4. **Public bucket**: **NEI** (privat)
5. Klikk **Save**

Tilgang er kun via signerte URL-er generert server-side med service role-nøkkelen.

### Opplastingsflyt

```
1. Client kaller trpc.document.createUploadUrl → server genererer signert PUT-URL (60 sek TTL)
2. Client PUT-er filen direkte til Supabase Storage
3. Client kaller trpc.document.create med filmetadata → lagres i Postgres
```

### Filsti i bucket

```
documents/{documentId}/{versionStamp}-{sanitizedFileName}
```

### Versjonshåndtering

- Hvert dokument har et `version`-felt (starter på 1)
- `trpc.document.update` med `bumpVersion: true` øker versjon og erstatter filreferansen
- `DocumentReadConfirmation` er unik på `(documentId, profileId, documentVersion)` – ny versjon krever ny bekreftelse

### Lesebekreftelser

- Alle ansatte kan bekrefte at de har lest gjeldende versjon
- HR/ADMIN ser statistikk: hvem har/ikke har lest, fremdriftslinje
- `trpc.document.readStatus` returnerer confirmedBy[] og notConfirmedBy[]

### Test dokumentarkiv

```bash
# 1. Kontroller at .env.local har SUPABASE_SERVICE_ROLE_KEY satt
# 2. Gå til /dokumenter
# 3. Som HR/ADMIN: klikk "Nytt dokument" og last opp en PDF
# 4. Åpne dokumentet → klikk "Last ned" og verifiser at signert URL virker
# 5. Klikk "Bekreft lest" → grønn hake vises i listen
# 6. Rediger dokumentet, last opp ny fil → versjon bumpes til v2
# 7. Lesebekreftelse for v1 gjelder ikke v2 – ny bekreftelse kreves
# 8. Som HR: gå til dokumentdetaljer → se lesestatistikk nederst
```

## Risikovurderinger (Steg 6)

### Datamodell

| Modell | Beskrivelse |
|--------|-------------|
| `RiskAssessment` | Selve vurderingen – tittel, avdeling, eier, status, reviewDate |
| `RiskItem` | Risikopunkt – fare, konsekvens, likelihood/impact/score/level, tiltak |
| `Action` | Tiltak – kan knyttes til RiskItem eller stå alene |

### Enums

| Enum | Verdier |
|------|---------|
| `RiskAssessmentStatus` | DRAFT, ACTIVE, REVIEW, CLOSED |
| `RiskLevel` | LOW, MEDIUM, HIGH, CRITICAL |
| `RiskItemStatus` | OPEN, IN_PROGRESS, RESOLVED |
| `ActionStatus` | OPEN, IN_PROGRESS, DONE, CANCELLED |
| `ActionPriority` | LOW, MEDIUM, HIGH, CRITICAL |

### Risikomatrise

Score = likelihood × impact (begge 1–5)

| Score | Nivå |
|-------|------|
| 1–4 | LOW |
| 5–9 | MEDIUM |
| 10–16 | HIGH |
| 17–25 | CRITICAL |

Riskutvå beregnes automatisk i `riskItem.create` og `riskItem.update`.

### Tilgangsregler

| Rolle | Risikovurderinger | Tiltak |
|-------|-------------------|--------|
| EMPLOYEE | Kan ikke se /risiko | Ser kun egne tiltak |
| MANAGER | Ser/oppretter/redigerer i egen avdeling | Ser avdelingens tiltak + egne |
| HR | Ser og administrerer alle | Ser og administrerer alle |
| ADMIN | Full tilgang + kan slette | Full tilgang |

### Test risikovurderinger

```bash
# 1. Kjør npm run db:push && npm run db:generate
# 2. Gå til /risiko som MANAGER eller HR
# 3. Klikk "Ny risikovurdering" – fyll inn tittel og velg avdeling
# 4. Åpne vurderingen – klikk "Legg til risikopunkt"
# 5. Sett likelihood=4, impact=4 → riskScore=16, riskLevel=HIGH (automatisk)
# 6. Klikk "Nytt tiltak" under risikopunktet → tildel til en ansatt
# 7. Gå til /tiltak → se tiltaket i listen
# 8. Åpne tiltaket → endre status til "Pågår" → "Fullført"
# 9. Som EMPLOYEE: /tiltak viser kun egne tiltak; /risiko redirecter til /tiltak
# 10. Verifiser audit log i Prisma Studio (RISK_ASSESSMENT_CREATED, RISK_ITEM_CREATED, ACTION_CREATED, ACTION_COMPLETED)
```

## Operativt Dashboard (Steg 7)

Dashboard er rollebasert og henter data via `dashboard.summary` (én tRPC-query).

### Hva som vises per rolle

| Seksjon | EMPLOYEE | MANAGER | HR/HMS | ADMIN |
|---------|----------|---------|--------|-------|
| Avvik – egne | ✅ | ✅ (avdeling) | ✅ (alle) | ✅ (alle) |
| Tiltak – mine | ✅ | ✅ (avdeling+) | ✅ (alle) | ✅ (alle) |
| Risikovurderinger | — | ✅ (avdeling) | ✅ (alle) | ✅ (alle) |
| Dokumenter/lesebekreftelse | ✅ | ✅ | ✅ | ✅ |
| Ansatte/avdelinger | — | — | ✅ | ✅ |

### Varselnivåer

- **Rødt**: kritiske avvik, forfalte tiltak, høy/kritiske risikopunkter
- **Gult**: åpne avvik, tiltak som snart forfaller, revisjon av risikovurderinger, dokumenter som utløper
- **Grønt**: alle dokumenter bekreftet

### Test dashboardet med ulike roller

```bash
# 1. Som EMPLOYEE:
#    - Se kun egne avvik, egne tiltak, dokumenter du må lese
#    - Ingen risikoseksjon

# 2. Som MANAGER (med avdeling satt):
#    - Se avvik og tiltak for avdelingen
#    - Se risikovurderinger i avdelingen
#    - Ingen avdelingsstatistikk

# 3. Som HR:
#    - Global oversikt – alle avvik, tiltak, risikovurderinger
#    - Avdelingsstatistikk med fremdriftslinje

# 4. Som ADMIN:
#    - Identisk med HR, men kan også slette risikovurderinger

# Test kritiske tilstander:
#    - Opprett et avvik med severity=CRITICAL → "Kritiske avvik" teller opp
#    - Sett dueDate i fortiden på et tiltak → "Forfalte tiltak" teller opp
#    - Sett reviewDate < 30 dager frem på risikovurdering → "Til revisjon ≤30d" teller opp
#    - Ikke bekreft et dokument → vises i "Mangler lesing"-listen
```

## Varslingssystem (Steg 8)

### Notification-modell

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `id` | String | cuid |
| `recipientId` | String | Profil-ID til mottaker |
| `type` | NotificationType | Enum – se under |
| `title` | String | Kort tittel |
| `message` | String | Melding |
| `linkUrl` | String? | Lenke til relevant side |
| `readAt` | DateTime? | null = ulest |
| `createdAt` | DateTime | Opprettet |

### Hendelser som trigger varsler

| Hendelse | Mottakere |
|----------|-----------|
| Nytt avvik opprettet | HR/ADMIN + leder i avdelingen + tildelt bruker |
| Avvik tildelt | Den tildelte brukeren |
| Avviksstatus endret | Reporter + ansvarlig (hvis ulik reporter) |
| Tiltak opprettet med ansvarlig | Den ansvarlige |
| Nytt PUBLIC dokument | Alle aktive ansatte |
| Nytt PRIVATE dokument | HR/ADMIN |
| Risikovurdering opprettet | HR/ADMIN + leder i avdelingen |

### Varselsenter

- `NotificationBell` i TopBar – polling hvert 30. sekund
- Rød badge med antall uleste (maks viser "9+")
- Dropdown med siste 5 varsler + lenke til `/varsler`
- Klikk på varsel → marker som lest + navigerer til `linkUrl`
- `/varsler` – full liste med filter "Alle / Uleste" + "Merk alle som lest"

### Test

```bash
# 1. npm run db:push && npm run db:generate (ny Notification-modell)
# 2. Logg inn som bruker A (EMPLOYEE), opprett et avvik → logg inn som HR/ADMIN og se varsel i bell
# 3. Tildel avvik til bruker B → logg inn som B → ser "Du ble tildelt et avvik"
# 4. Endre status på avvik → reporter mottar varsel
# 5. Som HR: opprett et dokument (PUBLIC) → alle ansatte mottar DOCUMENT_REQUIRES_READ-varsel
# 6. Klikk bell → dropdown med uleste → klikk varsel → rutes til riktig side + markeres som lest
# 7. Gå til /varsler → klikk "Merk alle som lest" → badge forsvinner
# 8. Opprett tiltak med assignedToId → den ansvarlige mottar ACTION_ASSIGNED-varsel
```

## PWA / Offline-støtte (Steg 9)

### Installasjon (manifest + ikoner)

```bash
# Generer placeholder-ikoner én gang (erstatt med ekte grafikk før produksjon)
node scripts/generate-icons-simple.mjs
# Produserer: public/icons/icon-192.png, icon-192-maskable.png, icon-512.png, icon-512-maskable.png
```

Manifest er konfigurert i `public/manifest.json` med:
- `shortcuts`: Rapporter avvik, Mine tiltak, Dokumenter
- Separate `any`- og `maskable`-ikoner for 192×192 og 512×512
- `lang: "nb"`, `scope: "/"`, `display: "standalone"`

### Service worker / caching

Konfigurert via `next-pwa` i `next.config.mjs`:

| URL-mønster | Strategi | Begrunnelse |
|-------------|----------|-------------|
| Supabase signerte URL-er | **NetworkOnly** | Inneholder hemmeligheter, utløper – ALDRI cache |
| Supabase auth-endepunkter | **NetworkOnly** | Auth-tilstand må alltid verifiseres server-side |
| `/api/trpc/*` | NetworkFirst (5s timeout, 60s TTL) | Fersk data foretrekkes, kort offline-cache |
| `/_next/static/*` | CacheFirst (7 dager) | Statiske assets endres aldri etter build |
| Bilder/ikoner | CacheFirst (30 dager) | Endres sjelden |
| App-sider | NetworkFirst (3s timeout, 1 dag) | Online-first med offline-fallback |

**Offline fallback-side**: `/offline` vises automatisk ved navigasjon uten nett.

### Offline-kladd for avvik

Brukere kan rapportere avvik selv uten internett:

1. `IncidentForm` oppdager offline-status via `useOnlineStatus()`
2. Submit-knappen endres til **"Lagre som kladd"**
3. Kladden lagres i `localStorage` via `lib/offline/drafts.ts`
4. Gul banner vises øverst: «Du er frakoblet – avvikskladder lagres lokalt»
5. Når nett er tilbake: `lib/offline/syncQueue.ts` sender kladder automatisk via tRPC
6. Grønn banner bekrefter: «Tilkobling gjenopprettet – synkroniserer kladder…»

```
lib/offline/
├── drafts.ts      # CRUD for IncidentDraft i localStorage
└── syncQueue.ts   # Sync pending drafts via tRPC når online

hooks/
├── useOnlineStatus.ts      # navigator.onLine + online/offline events
└── usePwaInstallPrompt.ts  # beforeinstallprompt-hook

features/pwa/
├── OnlineStatusBanner.tsx  # Gul/grønn banner (rendres i dashboard layout)
└── PWAInstallPrompt.tsx    # "Installer"-knapp i TopBar
```

**Data som ALDRI lagres offline:**
- Signerte Supabase URL-er (dokumentfiler, vedlegg)
- Ansattoversikter, risikovurderinger, private HR-data
- Auth-tokens eller session-data

### PWA Install Prompt

`PWAInstallPrompt` i TopBar viser en «Installer»-knapp når nettleseren tilbyr `beforeinstallprompt`-hendelsen. Knappen skjules automatisk etter installasjon eller om appen allerede kjører i standalone-modus.

### Test PWA

```bash
# 1. Bygg produksjonsversjon (service worker genereres ikke i dev)
npm run build && npm start

# 2. Åpne http://localhost:3000 i Chrome
# 3. DevTools → Application → Manifest – verifiser ikoner og shortcuts
# 4. DevTools → Application → Service Workers – verifiser at sw.js er aktiv
# 5. DevTools → Network → sett "Offline" → naviger til /dashboard
#    → /offline-siden vises
# 6. Gå til /avvik/ny offline → gul banner vises, submit → "Lagre som kladd"
# 7. Sett nett tilbake → grønn banner + kladden synkroniseres automatisk
# 8. Chrome: "Installer"-ikon i adressefeltet → test PWA-installasjon
# 9. Åpne installert app → standalone UI, ingen nettleserkrom
```

## Fravær og permisjon (Steg 10)

### Etter Steg 10 – kjør db:push

Schema har fått `LeaveRequest`, `LeaveRequestType` og `LeaveRequestStatus`, samt 4 nye `NotificationType`-verdier.

```bash
npm run db:push && npm run db:generate
```

### Datamodell

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `employeeId` | String | Søker |
| `departmentId` | String? | Avdeling |
| `type` | LeaveRequestType | Type fravær |
| `status` | LeaveRequestStatus | PENDING / APPROVED / REJECTED / CANCELLED |
| `startDate` / `endDate` | DateTime | Periode |
| `days` | Int | Kalenderdag-differanse (inkl. start og slutt) |
| `reason` | String? | Påkrevd for OTHER og UNPAID_LEAVE |
| `managerComment` | String? | Lederens kommentar ved beslutning |
| `decidedBy` / `decidedAt` | Profile? / DateTime? | Hvem godkjente/avslå og når |

### Tilgangsregler

| Rolle | Lese | Opprette | Redigere | Godkjenne/Avslå | Kansellere |
|-------|------|----------|----------|-----------------|------------|
| EMPLOYEE | Kun egne | ✅ | Kun egne PENDING | ❌ | Kun egne PENDING |
| MANAGER | Avdeling | ✅ | Kun egne PENDING | Avdeling (ikke egne) | Kun egne PENDING |
| HR | Alle | ✅ | Alle PENDING | Alle (ikke egne) | Alle PENDING |
| ADMIN | Alle | ✅ | Alle PENDING | Alle (ikke egne) | Alle PENDING |

### Varslingsflyt

| Hendelse | Mottakere |
|----------|-----------|
| Søknad opprettet | Leder i avdeling (MANAGER), eller HR/ADMIN hvis ingen avdeling |
| Søknad godkjent | Ansatt (søkeren) |
| Søknad avslått | Ansatt (søkeren) |
| Søknad kansellert | Leder / HR hvis relevant |

### Test fravær

```bash
# 1. npm run db:push && npm run db:generate (nytt schema)
# 2. Logg inn som EMPLOYEE
#    - Gå til /fravaer/ny → velg VACATION, sett datoer → Send søknad
#    - Se at søknad er PENDING i /fravaer
#    - Prøv å godkjenne din egen søknad → skal bli avvist

# 3. Logg inn som MANAGER (med avdeling satt)
#    - /fravaer viser søknader i avdelingen
#    - Åpne søknaden → Godkjenn / Avslå → ansatt mottar varsel
#    - Opprett en søknad som MANAGER → prøv å godkjenne den selv → avvist

# 4. Logg inn som HR/ADMIN
#    - /fravaer viser alle søknader i organisasjonen
#    - Kan godkjenne alle (unntatt egne)

# 5. Som EMPLOYEE: Kanseller en PENDING søknad → leder mottar varsel
# 6. Prøv å redigere en APPROVED søknad → skal redirecte til detaljsiden
# 7. Verifiser AuditLog i Prisma Studio:
#    LEAVE_REQUEST_CREATED, LEAVE_REQUEST_APPROVED, LEAVE_REQUEST_REJECTED, LEAVE_REQUEST_CANCELLED
```

## E-postvarsler med Resend (Steg 11A)

### Etter Steg 11A – kjør db:push

`Notification`-modellen har fått to nye felt: `emailSentAt` og `emailError`.

```bash
npm run db:push && npm run db:generate
```

### Oppsett

1. Opprett konto på [resend.com](https://resend.com) og generer en API-nøkkel
2. Verifiser domenet du vil sende fra i Resend-dashboardet (**Domains → Add domain**)
3. Kopier API-nøkkelen og fyll inn i `.env.local`:

```bash
RESEND_API_KEY=re_din_api_nøkkel
EMAIL_FROM=HR/HMS <no-reply@dittdomene.no>
EMAIL_NOTIFICATIONS_ENABLED=true   # eller false i dev
APP_URL=https://din-app.vercel.app  # brukes i lenker i e-posten
```

4. Installer pakker (gjøres automatisk ved `npm install` etter clone):

```bash
npm install   # resend er nå i package.json
```

### Miljøvariabler

| Variabel | Påkrevd | Beskrivelse |
|----------|---------|-------------|
| `RESEND_API_KEY` | Kun hvis EMAIL_NOTIFICATIONS_ENABLED=true | API-nøkkel fra Resend |
| `EMAIL_FROM` | Anbefalt | Avsenderadresse (verifisert domene) |
| `EMAIL_NOTIFICATIONS_ENABLED` | Nei | `true` = send e-post, `false` (standard) = kun console.log |
| `APP_URL` | Anbefalt | Full URL til appen (brukes i lenker i e-posten) |

### Utviklingsmodus (uten å sende faktiske e-poster)

Med `EMAIL_NOTIFICATIONS_ENABLED=false` (standard) sendes ingen e-poster. I stedet logger serveren hva som ville blitt sendt:

```
[email:dev] Would send to ansatt@example.com — "Nytt avvik registrert" (EMAIL_NOTIFICATIONS_ENABLED=false)
```

### Filstruktur

```
lib/email/
├── resend.ts                  # Resend-klient + sendEmail()
├── templates.ts               # buildNotificationEmail() – HTML + plaintext
└── sendNotificationEmail.ts   # Hjelper: send + oppdater emailSentAt/emailError
lib/
└── notifications.ts           # createNotification() m.fl. – fyrer e-post fire-and-forget
```

### Sikkerhetsegenskaper

- `RESEND_API_KEY` leses kun server-side – eksponeres aldri til klienten
- E-poster inneholder kun: varselstittel, melding og lenke inn i appen
- Ingen sensitive data (signerte URL-er, vedlegg, personnr.) i e-postteksten
- Feil ved e-postsending krasjer aldri hovedflyten (`try/catch`, fire-and-forget)
- `emailError` (maks 500 tegn) lagres på `Notification`-raden for sporing

### Audit trail

Hvert `Notification`-rad har:
- `emailSentAt`: tidspunkt for vellykket sending (null = ikke sendt ennå)
- `emailError`: feilmelding fra Resend eller nettverksfeil (null = OK)

Sjekk i Prisma Studio: **Notification → emailSentAt / emailError**

### Test e-postvarsler

```bash
# Dev-modus (ingen faktiske e-poster):
# 1. Sett EMAIL_NOTIFICATIONS_ENABLED=false i .env.local (standard)
# 2. npm run dev
# 3. Utfør en handling som trigger varsel (f.eks. opprett avvik)
# 4. Se server-loggen: "[email:dev] Would send to ..." bekrefter at e-post ville blitt sendt

# Produksjonstesting med faktiske e-poster:
# 1. Sett RESEND_API_KEY, EMAIL_FROM, EMAIL_NOTIFICATIONS_ENABLED=true, APP_URL i .env.local
# 2. npm run build && npm start
# 3. Opprett et avvik → HR-bruker mottar e-post med varsel
# 4. Kontroller emailSentAt i Prisma Studio under Notification-tabellen
# 5. Sjekk Resend-dashboardet → Emails for leveransestatus

# Ved feil:
# 6. emailError-feltet på Notification-raden inneholder feilmeldingen
# 7. Appen fortsetter som normalt — e-postfeil er ikke fatale
```

### Begrensninger Steg 11A

- Kun transaksjonelle varsler — ingen daglig digest eller batch-oppsummering
- Ingen Web Push / VAPID (kommer i neste steg)
- `EMAIL_FROM`-domenet må være verifisert i Resend — ellers avvises sending
- Ingen e-postkø eller retry-mekanisme — feil logges og lagres, men ikke forsøkt på nytt

### Begrensninger Steg 10

- **Dager** beregnes som kalenderdager (inkl. helger) — helgedager/helligdager ikke trukket fra
- Ingen integrasjon med NAV/Altinn
- Ingen lønnsberegning eller automatisk feriepengeopptjening
- Ingen kalendervisning — kun liste. Kan legges til i neste steg.
- Ingen årsstatistikk per ansatt

## Fraværskalender (Steg 12)

### Ruter

| Rute | Beskrivelse |
|------|-------------|
| `/fravaer/kalender` | Måneds- og årsvisning av fravær. Tilgjengelig fra sidebar og via "Kalender"-knappen på /fravaer |

### Tilgangsregler

| Rolle | Ser |
|-------|-----|
| EMPLOYEE | Kun eget fravær |
| MANAGER | Fravær i egen avdeling |
| HR | Alt fravær i organisasjonen + avdelingsfilter |
| ADMIN | Alt fravær i organisasjonen + avdelingsfilter |

### Visninger

**Månedsvisning:**
- 7-kolonne kalenderrutenett (mandag–søndag)
- Hver dag viser farvekodede prikker/bars per fraværstype
- Ventende søknader vises med gul ramme
- Klikk på en dag → detaljpanel med alle overlappende fraværssøknader
- Navigasjon forrige/neste måned

**Årsvisning:**
- 12 månedskort i rutenett
- Hvert kort viser antall godkjente fraværsdager og antall ventende søknader
- Klikk på måned → bytter til månedsvisning for den måneden

### Filtre

| Filter | Tilgjengelig for |
|--------|------------------|
| Avdeling | Kun HR/ADMIN |
| Status (PENDING/APPROVED) | Alle |
| Type (ferie, sykemelding, osv.) | Alle |

### tRPC

`leaveRequest.calendar` — input: `year`, `month?`, `departmentId?`, `status[]?`, `type[]?`

Dato-overlapp: returnerer alle søknader der `startDate ≤ periodEnd AND endDate ≥ periodStart`.
Standard uten statusfilter: viser kun PENDING og APPROVED (REJECTED/CANCELLED skjules).

### Test fraværskalender

```bash
# Forutsetning: minst én LeaveRequest i databasen

# 1. Gå til /fravaer/kalender som EMPLOYEE
#    → Ser kun egne søknader. Avdelingsfilter vises ikke.

# 2. Gå til /fravaer/kalender som MANAGER
#    → Ser kun søknader i sin avdeling.

# 3. Gå til /fravaer/kalender som HR/ADMIN
#    → Ser alle søknader. Avdelingsfilter vises og fungerer.

# 4. Test månedsskifte:
#    → Opprett en søknad som går over to måneder (f.eks. 28. jan – 3. feb)
#    → Søknaden skal vises i begge månedene

# 5. Test visninger:
#    → Klikk "År"-knapp → årsvisning med månedskort
#    → Klikk på et månedskort → bytter til månedsvisning for den måneden

# 6. Test dagdetaljpanel:
#    → Klikk på en dag med fravær → panel vises under kalenderen
#    → Klikk på en søknad i panelet → navigerer til /fravaer/[id]
#    → Klikk på dagen igjen → panel lukkes

# 7. Test filtre:
#    → Fjern haken for "Til behandling" → PENDING-søknader forsvinner
#    → Velg kun "Ferie" som type → andre typer skjules

# 8. Test årsnavigasjon:
#    → Bruk ← → knappene ved siden av årstallet → årstallet endres
#    → Årsvisning oppdateres med riktig data

# 9. Test fargesymboler:
#    → Legenden nederst på siden viser alle fraværstyper
#    → Ventende søknader har gul ramme, godkjente har farget prikk
```

### Kjente begrensninger Steg 12

- Helligdager trekkes ikke fra fraværsdager (som i Steg 10)
- Ingen eksport til CSV/PDF
- Ingen skriving/oppretting av fravær direkte fra kalenderen
- Overlappende fravær på samme dag trunkeres til "X til" ved mer enn 3 søknader

## Rapporter og eksport (Steg 13)

### Tilgang

| Rolle | Tilgang |
|-------|---------|
| EMPLOYEE | Ingen tilgang – redirectes til /ingen-tilgang |
| MANAGER | Rapporter begrenset til egen avdeling. Avdelingsfilter ikke tilgjengelig. |
| HR / ADMIN | Alle rapporter. Avdelingsfilter tilgjengelig. |

> **Merk:** Det finnes ingen HMS-rolle i systemet. HMS-funksjonalitet dekkes av HR-rollen.

### Rapporttyper

| Type | Filterdato | Kolonner |
|------|-----------|----------|
| Avvik | Opprettet | Dato, Tittel, Status, Alvorlighetsgrad, Avdeling, Rapportert av, Ansvarlig, Frist |
| Tiltak | Opprettet | Dato, Tittel, Status, Prioritet, Avdeling, Ansvarlig, Frist, Fullført dato |
| Risiko | Opprettet | Risikovurdering, Avdeling, Fare, Konsekvens, Sannsynlighet, Konsekvensgrad, Risikoscore, Risikonivå, Status, Ansvarlig, Frist |
| Dokumentlesing | Bekreftet | Dokument, Versjon, Ansatt, Avdeling, Bekreftet lest, Dato |
| Fravær | Startdato | Ansatt, Avdeling, Type, Status, Fra, Til, Dager |

### CSV-format

- Separator: **semikolon** (`;`) – fungerer uten konfigurasjon i norsk Excel
- Tegnsett: **UTF-8 med BOM** – Excel åpner norske tegn korrekt
- Datoformat: **YYYY-MM-DD**
- Fritekstfelt med semikolon/anførselstegn/linjeskift escapes med RFC-4180 dobbel-quoting
- Kolonneheader på norsk
- Filnavn: `avvik-YYYY-MM-DD.csv`, `tiltak-YYYY-MM-DD.csv`, osv.

### Filstruktur

```
lib/reports/
├── csv.ts         # escapeCsv(), fmtDate(), buildCsv() — rene hjelpefunksjoner
└── queries.ts     # RBAC-filtrerte dataspørringer, delt mellom tRPC og CSV-route

server/routers/
└── report.ts      # tRPC report.query — for forhåndsvisning i UI

app/api/reports/csv/
└── route.ts       # GET /api/reports/csv?type=...&from=...&to=...&departmentId=...

features/reports/
├── RapporterClient.tsx   # Klient: fanevalg, filtre, forhåndsvisning, eksportknapp
├── ReportFilters.tsx     # Fra/til dato + avdelingsfilter
├── ReportTable.tsx       # Generisk tabell (viser første 20 rader)
└── ExportButton.tsx      # <a download> mot CSV-endepunktet
```

### Sikkerhetsegenskaper

- Rolle-filtrering skjer **server-side** i `lib/reports/queries.ts` — gjelder både UI-visning og CSV-nedlasting
- CSV-endepunktet (`/api/reports/csv`) verifiserer auth og profil uavhengig av UI
- Ingen signerte Supabase-URL-er, filstier eller vedlegg eksporteres
- Sensitiv fritekst (`reason`, `managerComment`, `description`) er ikke inkludert i eksport
- MANAGER kan ikke overstyre avdelingsfilter — departmentId tvinges server-side

### Test rapporter

```bash
# 1. Opprett testdata: minst ett avvik, tiltak, risikovurdering, dokumentlesing og fraværssøknad

# 2. EMPLOYEE-test:
#    - Logg inn som EMPLOYEE → gå til /rapporter → skal redirectes til /ingen-tilgang

# 3. MANAGER-test:
#    - Logg inn som MANAGER (med avdeling satt)
#    - /rapporter viser kun rapporter for MANAGER sin avdeling
#    - Avdelingsfilter vises ikke
#    - Klikk "Eksporter CSV" → CSV inneholder kun avdelingsdata

# 4. HR/ADMIN-test:
#    - Logg inn som HR eller ADMIN
#    - Velg "Avvik"-fanen → se forhåndsvisning med maks 20 rader
#    - Filtrer på dato (fra/til) → tabellen oppdateres
#    - Velg avdeling → kun den avdelingens data vises
#    - Klikk "Eksporter CSV" → fil lastes ned

# 5. Test CSV i Excel:
#    - Åpne eksportert fil i Excel (norsk)
#    - Tegn som æ, ø, å skal vises korrekt (UTF-8 BOM)
#    - Semikolon skal brukes som kolonneskiller
#    - Datoer skal vises som YYYY-MM-DD

# 6. Test RBAC i CSV-endepunktet direkte:
#    curl "http://localhost:3000/api/reports/csv?type=incidents" → 401 (ikke innlogget)
#    Som EMPLOYEE: → 403 Forbidden
#    Som MANAGER: → kun avdelingsdata, ikke hele org

# 7. Test datofilter:
#    - Sett "Fra dato" til i dag → kun dagens poster vises
#    - Sett "Til dato" til i går → 0 rader
#    - Klikk "Nullstill" → alle rader tilbake
```

### Kjente begrensninger Steg 13

- Forhåndsvisning viser maks 20 rader; eksport inneholder alle rader
- Ingen paginering i preview-tabellen
- Datofilteret for "Avvik" og "Tiltak" er basert på `createdAt`, ikke `occurredAt` / `dueDate`
- Datofilteret for "Fravær" er basert på `startDate`
- Ingen planlagte/automatiske rapporter (cron-jobb, e-post-digest)
- Ingen PDF-eksport

## Sikkerhet (Steg 14)

### HTTP-sikkerhetsheaders

Lagt til i `next.config.mjs` og gjelder alle ruter:

| Header | Verdi | Formål |
|--------|-------|--------|
| `Content-Security-Policy` | Se under | XSS-begrensning |
| `X-Frame-Options` | `DENY` | Clickjacking-blokkering |
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing-blokkering |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Lekkasje av URL til tredjepart |
| `Permissions-Policy` | camera, mic, geo, payment = () | Deaktiverer nettleser-APIs appen ikke bruker |
| `Strict-Transport-Security` | `max-age=31536000` | HTTPS-tvang (kun produksjon) |

**CSP highlights:**
- `connect-src`: kun `'self'` og Supabase-domenet
- `frame-src 'none'` + `frame-ancestors 'none'`: ingen iframes
- `object-src 'none'`: ingen plugins
- `form-action 'self'`: skjema kan ikke sendes til andre domener
- `script-src`: bruker `'unsafe-inline'` fordi Next.js 14 App Router injiserer bootstrap-scripts. For produksjon med nonce-basert CSP, se upgrade-path under.

**CSP nonce-upgrade-path (fremtidig steg):**
Implementer nonce i `middleware.ts`, sett `x-nonce` header, les det i `app/layout.tsx` og send til `<Script nonce>`. Fjern da `'unsafe-inline'` fra `script-src`.

### Rate limiting

Implementert i `lib/security/rateLimit.ts` (in-memory, sliding window):

| Endpoint | Grense | Vindu |
|----------|--------|-------|
| CSV-eksport (`/api/reports/csv`) | 20 forespørsler | 5 minutter per bruker |
| Filopplastings-URL (attachment + document) | 30 genererte URL-er | 1 minutt per bruker |

**Produksjonsanbefaling:** Next.js serverless-funksjoner er statsløse — in-memory-limiteren nullstilles ved cold starts. For harde garantier, erstatt `Map`-store med [Upstash Redis](https://upstash.com) via `@upstash/ratelimit`.

### RBAC-modell

| Rolle | Beskrivelse |
|-------|-------------|
| EMPLOYEE | Leser/oppretter kun egne data (avvik, fravær, dokumenter de har tilgang til) |
| MANAGER | Leser/modererer avvik, fravær, tiltak i **sin avdeling** |
| HR | Full tilgang til all data unntatt system-admin-operasjoner |
| ADMIN | Full tilgang inkludert sletting av risikovurderinger, brukeradministrasjon |

RBAC håndheves i tRPC-middleware (`profileProcedure`, `hrProcedure`, `adminProcedure`) og i hver prosedyre individuelt. CSV-eksporten bruker samme RBAC-logikk som UI-forhåndsvisning (`lib/reports/queries.ts`).

### Storage-sikkerhet

- Service role-nøkkel (`SUPABASE_SERVICE_ROLE_KEY`) brukes **utelukkende server-side**
- Begge buckets (`incident-attachments`, `documents`) er **private**
- Signerte nedlastings-URL-er har **60 sekunders TTL**
- Filnavn saniteres med regex før lagring (`lib/supabase/admin.ts`)
- MIME-type valideres mot tillatt liste (enum i Zod) på **server-side** — også for `createMetadata` og `createDocument` (bug funnet og fikset i Steg 14)
- Filstørrelse valideres mot `MAX_FILE_SIZE_BYTES` (10 MB) — både i upload-URL og metadata
- Service worker cacher **aldri** signerte URL-er (NetworkOnly-regel)
- CSV-eksport cacher **aldri** sensitive data (`Cache-Control: no-store`)

### E-post og personvern

- `RESEND_API_KEY` er server-only — eksponeres aldri til klient
- E-poster inneholder kun: varselstittel, kort melding, lenke inn i appen
- Ingen sensitive fritekstfelt (reason, description, managerComment) sendes i e-post
- Ingen filvedlegg eller signerte URL-er i e-poster

### PWA/offline-personvern

- Offline-kladder lagres i `localStorage` under `hr_hms_incident_drafts`
- Kun avvikskladder lagres lokalt — **ingen** dokumenter, risiko-data eller HR-data offline
- `clearAllDrafts()` kalles automatisk ved logout — rydder localStorage
- Sync-queue har en global `syncing`-flag som forhindrer parallelle sync-kjøringer. **Begrensning:** flaget nullstilles ved reload — bruker kan i teorien sende kladder to ganger etter hard refresh. Tiltaket er idempotent siden tRPC-mutations ikke bruker `id` fra kladd.
- `location`-feltet i `IncidentDraft` er en harmløs rest etter Steg 9.5 — feltet ignoreres av tRPC-prosedyren

### Audit log

Viktige handlinger logges til `AuditLog`-tabellen:

| Handling | Loggføres |
|----------|-----------|
| Avvik opprettet / endret / status-endret | ✅ |
| Vedlegg lastet opp / slettet | ✅ |
| Dokument opprettet / oppdatert / bekreftet lest | ✅ |
| Risikovurdering / risikopunkt / tiltak opprettet / endret / fullført | ✅ |
| Fraværssøknad opprettet / godkjent / avslått / kansellert | ✅ |
| CSV-rapport eksportert | ✅ (Steg 14) |
| Innlogging / utlogging | ❌ — håndteres av Supabase Auth |

### Inputvalidering — fikset i Steg 14

| Felt | Gammelt | Nytt |
|------|---------|------|
| `incident.description` (create + update) | `z.string().min(10)` uten max | `z.string().min(10).max(5000)` |
| `attachment.createMetadata.mimeType` | `z.string()` (fri tekst) | `z.enum(ALLOWED_MIME_TYPES)` |
| `attachment.createMetadata.attachmentId/incidentId` | `z.string()` | `z.string().max(128)` |
| `document.create.mimeType` | `z.string()` | `z.enum(ALLOWED_MIME_TYPES)` |
| `document.update.mimeType` | `z.string().optional()` | `z.enum(ALLOWED_MIME_TYPES).optional()` |
| `document.create/update.filePath` | `z.string()` | `z.string().max(500)` |

### Testkommandoer

```bash
# TypeScript-typesjekk (krever Node 18+)
npx tsc --noEmit

# Produksjonsbygg
npm run build

# Lint
npm run lint

# Sikkerhetsaudit av npm-pakker
npm audit

# Test headers manuelt (produksjon):
curl -I https://din-app.vercel.app | grep -i "content-security\|x-frame\|strict-transport"
```

### Gjenværende produksjons-TODO

- [ ] **Nonce-basert CSP**: fjern `'unsafe-inline'` fra `script-src` — krever middleware-nonce + `<Script nonce>` i layout
- [ ] **Redis rate limiting**: erstatt in-memory `Map` med Upstash Redis for multi-instance garantier
- [ ] **Supabase RLS**: vurder Row Level Security på Supabase-tabellene som ekstra forsvarslinje
- [ ] **Vercel WAF**: aktiver Vercel's innebygde WAF og DDoS-beskyttelse i produksjon
- [ ] **npm audit**: kjør `npm audit --production` og oppdater pakker med kritiske hull
- [ ] **Auth-rate limiting**: Supabase Auth har innebygd rate limiting — verifiser at det er aktivert i Supabase-dashboardet (Auth → Settings → Rate Limits)

## Web Push-varsler (Steg 15)

### Oppsett — VAPID-nøkler

```bash
# Installer web-push globalt (engangsoperasjon)
npx web-push generate-vapid-keys
# Kopier output til .env.local:
# VAPID_PUBLIC_KEY=...
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=...  (samme verdi)
# VAPID_PRIVATE_KEY=...
# VAPID_SUBJECT=mailto:admin@dittdomene.no
```

**Viktig:** `VAPID_PUBLIC_KEY` og `NEXT_PUBLIC_VAPID_PUBLIC_KEY` skal ha identiske verdier. VAPID public key er offentlig og trygg å eksponere til klienten — det er private key som er hemmelig.

### Etter Steg 15 — kjør db:push

Schema har fått `PushSubscription`-modellen.

```bash
npm run db:push && npm run db:generate
npm install          # installer web-push
```

### Miljøvariabler

| Variabel | Synlighet | Beskrivelse |
|----------|-----------|-------------|
| `VAPID_PUBLIC_KEY` | SERVER-ONLY | VAPID public key for server-side signering |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | PUBLIC | Samme verdi — tilgjengelig for klient-SW-subscriptions |
| `VAPID_PRIVATE_KEY` | SERVER-ONLY | VAPID private key — aldri eksponer |
| `VAPID_SUBJECT` | SERVER-ONLY | `mailto:`-adresse — identifiserer deg overfor push-tjenester |
| `PUSH_NOTIFICATIONS_ENABLED` | SERVER-ONLY | `true` = send faktiske push, `false` = console.log |

### Arkitektur

```
PushSubscription (DB)
├── endpoint        — unik per nettleser/enhet
├── p256dh, auth    — krypteringsnøkler (aldri eksponert via API)
├── profileId       — knyttet til innlogget profil
├── lastUsedAt      — oppdateres ved vellykket sending
└── revokedAt       — soft-delete ved 404/410 fra push-tjenesten

lib/push/
├── webPush.ts              — VAPID-konfigurering + sendWebPush()
└── sendPushNotification.ts — sendPushToProfile() — sender til alle aktive subscriptions

lib/notifications.ts       — integrert: createNotification() fyrer push fire-and-forget
worker/index.js            — custom SW: push event + notificationclick handler
```

### Personalvern og sikkerhet

- Bruker må **eksplisitt** klikke "Aktiver push" og godta nettleserens tillatelsesdialog
- Brukeren kan deaktivere push til enhver tid
- Push-payload inneholder kun: varselstittel (≤120 tegn), kort melding, lenke inn i appen
- Ingen sensitive detaljer (beskrivelser, dokumentinnhold, fraværsårsaker) i push-payload
- `p256dh`/`auth` lagres i databasen men eksponeres **aldri** via API-responser
- Subscriptions er knyttet til innlogget profil — andre kan ikke motta dine push
- Ved logout slettes **ikke** subscription automatisk (enheten abonnerer fortsatt). Brukeren kan manuelt deaktivere via "Deaktiver push"-knappen. Dette er bevisst: bruker kan logge inn igjen og fortsatt motta varsler uten å re-abonnere.

### Nettleserbegrensninger

| Nettleser | Status |
|-----------|--------|
| Chrome (desktop + Android) | ✅ Full støtte |
| Firefox (desktop) | ✅ Full støtte |
| Safari 16.4+ (iOS + macOS) | ✅ Støttet (krever installert PWA på iOS) |
| Safari < 16.4 | ❌ Ikke støttet |
| Samsung Internet | ✅ Støttet |

`PushNotificationSettings` skjuler seg automatisk hvis nettleseren ikke støtter push.

### Test Web Push

```bash
# Forutsetning: npm run build && npm start (SW genereres ikke i dev)

# 1. Generer VAPID-nøkler og legg i .env.local
# 2. Sett PUSH_NOTIFICATIONS_ENABLED=false for dev-testing (console.log)
#    eller =true for faktisk push

# 3. Aktiver push:
#    → Gå til /varsler
#    → Klikk "Aktiver push" → godta nettleserens tillatelsesdialog
#    → Status endres til "Aktiv på denne enheten"

# 4. Send testvarsel:
#    → Klikk "Send testvarsel"
#    → Push-varsel vises i OS-varselskuff

# 5. Trigger push via app-hendelser:
#    → Opprett avvik → HR/ADMIN får push + in-app + e-post (hvis aktivert)
#    → Tildel tiltak → ansvarlig får push
#    → Godkjenn/avslå fraværssøknad → søker får push

# 6. Test 410-håndtering (expired endpoint):
#    → I Prisma Studio: endre endpoint på en PushSubscription til en ugyldig URL
#    → Trigger en varsling → revokedAt settes automatisk

# 7. Test PUSH_NOTIFICATIONS_ENABLED=false:
#    → Server-loggen viser "[push:dev] Would push to …" uten faktisk sending

# 8. Test deaktivering:
#    → Klikk "Deaktiver push" → subscription soft-deletes + nettleseren unsubscriber
#    → Push-varsler stopper på denne enheten

# 9. Kontroller subscription i Prisma Studio:
#    → PushSubscription-tabellen → endpoint, profileId, lastUsedAt, revokedAt
```

### Kjente begrensninger Steg 15

- SW-push krever produksjonsbygg (`npm run build`) — PUSH-hendelser virker ikke i `npm run dev`
- iOS krever at PWA er installert (lagt til hjemskjerm) for push-støtte
- In-memory rate limiter fra Steg 14 gjelder ikke for push-sending (push er server-initiert)
- Ingen push-batching: hvert varsel sender én push per subscription
- Ingen preferanser per varselstype — push aktiveres for alle varsler eller ingen

## Produksjonsdeploy (Steg 16A)

### Oversikt

Anbefalt produksjonsoppsett: **Vercel** (hosting) + **Supabase** (database, auth, storage).

```
GitHub → Vercel (bygg + deploy)
              ↓
         Next.js app
              ↓
        Supabase (Postgres + Auth + Storage)
              ↓
         Resend (e-post)
```

---

### 1. Forberedelse — repo og verktøy

```bash
# Sørg for at alle filer er committet
git status
git add -A && git commit -m "chore: production ready"
git push origin main

# Verifiser at bygg går gjennom lokalt
npm run build
```

---

### 2. Supabase produksjonsprosjekt

#### 2.1 Opprett nytt prosjekt

1. Gå til [supabase.com](https://supabase.com) → **New project**
2. Velg region nær brukerne (anbefalt: `eu-north-1` – Stockholm)
3. Sett et sterkt databasepassord og noter det

#### 2.2 Hent tilkoblingsstrenger

Gå til **Settings → Database → Connection string**:

| Variabel | Kilde | Port |
|----------|-------|------|
| `DATABASE_URL` | Transaction pooler | 6543 |
| `DIRECT_URL` | Session pooler | 5432 |

Legg til `?pgbouncer=true` på `DATABASE_URL`.

#### 2.3 Hent API-nøkler

Gå til **Settings → API**:

| Variabel | Kilde |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (hemmelig — kun server-side) |

#### 2.4 Kjør Prisma-migrering

**Bruk `migrate deploy` i produksjon — ikke `db:push`:**

```bash
# Én gang, fra lokal maskin mot produksjonsdatabasen:
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy

# Deretter generer klienten:
npm run db:generate
```

> `db:push` er for utvikling. `migrate deploy` kjører SQL-migreringer i riktig rekkefølge og er trygt for produksjon.

**Merk:** `build`-scriptet kjører `prisma generate` automatisk (`"build": "prisma generate && next build"`).

#### 2.5 Supabase Auth — URL-konfigurasjon

Gå til **Authentication → URL Configuration** i Supabase-dashboardet:

| Felt | Verdi |
|------|-------|
| Site URL | `https://ditt-domene.no` |
| Redirect URLs | `https://ditt-domene.no/auth/callback` |

Legg også til preview-URL hvis ønskelig:
```
https://*.vercel.app/auth/callback
```

#### 2.6 Supabase Storage — buckets

Opprett to private buckets i **Storage → New bucket**:

| Bucket | Public | Brukes til |
|--------|--------|------------|
| `incident-attachments` | ❌ Nei | Vedlegg til avvik |
| `documents` | ❌ Nei | Dokumentarkiv |

All tilgang skjer via signerte URL-er generert server-side med `SUPABASE_SERVICE_ROLE_KEY`. Ingen ekstra RLS-regler er nødvendig.

---

### 3. Vercel — opprett og konfigurer prosjekt

#### 3.1 Koble repo

1. Gå til [vercel.com](https://vercel.com) → **Add New Project**
2. Importer GitHub-repositoriet
3. Vercel oppdager Next.js automatisk

#### 3.2 Build-innstillinger

Vercel bruker `vercel.json` som er inkludert i repoet:

| Innstilling | Verdi |
|-------------|-------|
| Framework | Next.js |
| Build Command | `npm run build` (inkluderer `prisma generate`) |
| Install Command | `npm install` |
| Output Directory | `.next` (automatisk) |
| Node.js version | 18.x (settes i Vercel Settings → General) |

#### 3.3 Miljøvariabler i Vercel

Gå til **Settings → Environment Variables** og legg inn alle variabler fra tabellen under.

Velg riktig scope for hver variabel:

| Variabel | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | — |
| `DATABASE_URL` | ✅ | ✅ | — |
| `DIRECT_URL` | ✅ | ✅ | — |
| `APP_URL` | ✅ | ✅ | — |
| `RESEND_API_KEY` | ✅ | — | — |
| `EMAIL_FROM` | ✅ | — | — |
| `EMAIL_NOTIFICATIONS_ENABLED` | `true` | `false` | `false` |
| `VAPID_PUBLIC_KEY` | ✅ | ✅ | — |
| `VAPID_PRIVATE_KEY` | ✅ | ✅ | — |
| `VAPID_SUBJECT` | ✅ | ✅ | — |
| `PUSH_NOTIFICATIONS_ENABLED` | `true` | `false` | `false` |

**Viktig:** `APP_URL` i produksjon skal være `https://ditt-domene.no` — brukes i e-postlenker og CSP.

#### 3.4 Custom domain

1. Gå til **Settings → Domains** i Vercel-prosjektet
2. Legg til ditt domene (f.eks. `hms.bedrift.no`)
3. Konfigurer DNS-pekere hos din domeneregistrar (CNAME eller A-record, Vercel viser eksakt verdi)
4. Vercel provisjonerer HTTPS/TLS automatisk via Let's Encrypt

---

### 4. VAPID-nøkler for Web Push

Generer nøkler én gang og lagre dem som Vercel-hemmeligheter:

```bash
npx web-push generate-vapid-keys
# Output:
# Public Key: BExxx...
# Private Key: xxx...

# Legg inn i Vercel:
# VAPID_PUBLIC_KEY = BExxx...
# NEXT_PUBLIC_VAPID_PUBLIC_KEY = BExxx...  (samme verdi)
# VAPID_PRIVATE_KEY = xxx...
# VAPID_SUBJECT = mailto:admin@dittdomene.no
```

---

### 5. Resend — e-post

1. Opprett konto på [resend.com](https://resend.com)
2. Gå til **Domains → Add domain** og verifiser ditt avsenderdomene (legg til DNS TXT/MX-records)
3. Gå til **API Keys → Create API Key**
4. Sett disse Vercel-variablene:
   - `RESEND_API_KEY` = `re_xxx...`
   - `EMAIL_FROM` = `HR/HMS <no-reply@dittdomene.no>`
   - `EMAIL_NOTIFICATIONS_ENABLED` = `true`

---

### 6. PWA og Web Push i produksjon

| Krav | Detalj |
|------|--------|
| HTTPS | Påkrevd for service worker og Web Push. Vercel leverer HTTPS automatisk. |
| Service worker | Genereres kun ved `npm run build` — ikke i `npm run dev` |
| iOS push | Krever at appen er installert (lagt til hjemskjerm) |
| PWA-ikoner | Erstatt `public/icons/*.png` med ekte grafikk (192×192 og 512×512, maskable) |
| manifest.json | `name`, `short_name`, `theme_color` bør tilpasses bedriften |

---

### 7. Deploy — steg for steg

```bash
# Steg 1: Pushe kode til GitHub
git push origin main

# Steg 2: Vercel deployer automatisk ved push til main
# Følg med på Vercel → Deployments

# Steg 3: Kjør Prisma-migrering mot produksjonsdatabasen
# (kun nødvendig ved første deploy eller ved nye migreringer)
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npx prisma migrate deploy

# Steg 4: Verifiser deploy
curl -I https://ditt-domene.no
# Forventer: 200 OK
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains
# x-frame-options: DENY
# x-content-type-options: nosniff

# Steg 5: Kjør smoke test (se under)
```

---

### 8. Smoke test etter deploy

Gå gjennom listen punkt for punkt etter første produksjonsdeploy:

#### Auth
- [ ] Gå til `https://ditt-domene.no` → redirectes til `/login`
- [ ] Logg inn med gyldig bruker → redirectes til `/dashboard`
- [ ] Logg ut → redirectes til `/login`

#### Dashboard
- [ ] `/dashboard` laster uten feil
- [ ] Riktig rolle-data vises (EMPLOYEE, MANAGER, HR, ADMIN)

#### Avvik
- [ ] `/avvik` laster liste
- [ ] `/avvik/ny` → opprett avvik → lagres og vises i listen
- [ ] Rediger avvik → statusendring fungerer
- [ ] AuditLog-rad opprettes (verifiser i Prisma Studio mot prod)

#### Vedlegg (Supabase Storage)
- [ ] Last opp PDF på et avvik → opplasting fullfører uten feil
- [ ] Klikk nedlastingsikonet → signert URL åpnes (60 sek TTL)
- [ ] Sjekk Supabase → Storage → `incident-attachments` at filen er der

#### Dokumenter
- [ ] `/dokumenter` laster liste
- [ ] Last opp dokument (som HR/ADMIN) → vises i listen
- [ ] Klikk "Last ned" → signert URL fungerer
- [ ] Klikk "Bekreft lest" → grønn hake vises

#### Risiko og tiltak
- [ ] `/risiko` laster (som MANAGER/HR/ADMIN)
- [ ] Opprett risikovurdering → risikopunkt → tiltak
- [ ] Endre tiltaksstatus → varsler sendes

#### Fravær
- [ ] Opprett fraværssøknad som EMPLOYEE
- [ ] Godkjenn som MANAGER/HR → søker mottar varsel
- [ ] `/fravaer/kalender` viser måneds- og årsvisning

#### Rapporter
- [ ] `/rapporter` tilgjengelig for HR/ADMIN
- [ ] Klikk "Eksporter CSV" → fil lastes ned
- [ ] Åpne CSV i Excel — norske tegn korrekte, semikolon-separator

#### In-app varsler
- [ ] Varselklokke i TopBar viser uleste
- [ ] Klikk varsel → navigerer til riktig side + markeres som lest

#### E-postvarsler
- [ ] Opprett avvik → sjekk at e-post mottas av HR-bruker
- [ ] Sjekk Resend-dashboardet → Emails for leveransestatus
- [ ] `emailSentAt` settes på `Notification`-rad i databasen

#### Web Push
- [ ] Gå til `/varsler` → klikk "Aktiver push" → godta tillatelse
- [ ] Klikk "Send testvarsel" → push-varsel vises i OS
- [ ] Opprett avvik → HR mottar push-varsel

#### PWA-installasjon
- [ ] Åpne i Chrome → "Installer"-ikon vises i adressefeltet
- [ ] Installer → appen åpner i standalone-modus
- [ ] Sjekk at service worker er aktiv (DevTools → Application → Service Workers)

#### Offline-kladd
- [ ] Skru av nett (DevTools → Network → Offline)
- [ ] Gå til `/avvik/ny` → gul banner vises
- [ ] Fyll inn og trykk "Lagre som kladd" → bekreftelsemelding
- [ ] Skru på nett → kladden synkroniseres automatisk

#### Sikkerhetsheaders
```bash
curl -I https://ditt-domene.no | grep -i "strict-transport\|x-frame\|content-security\|x-content-type"
# Forventet output:
# strict-transport-security: max-age=31536000; includeSubDomains
# x-frame-options: DENY
# x-content-type-options: nosniff
# content-security-policy: default-src 'self'; ...
```

---

### 9. Rollback

Vercel beholder alle tidligere deployments:

1. Gå til Vercel → **Deployments**
2. Finn siste fungerende deployment
3. Klikk **⋯ → Promote to Production**

For databaseendringer: Prisma støtter ikke automatisk rollback av `migrate deploy`. Lag backup av databasen **før** migrering (Supabase → Database → Backups).

---

### 10. Monitoring

| Verktøy | Hva du overvåker | Hvor |
|---------|-----------------|------|
| Vercel Logs | Server-feil, function timeouts, bygg-feil | Vercel → Deployments → Functions |
| Supabase Logs | Database-feil, Auth-feil, Storage-feil | Supabase → Logs |
| Resend Logs | E-postleveranse, bounce, spam | resend.com → Emails |
| Supabase Auth | Innlogginger, rate limiting | Supabase → Authentication → Logs |

**Anbefalte TODO for produksjon:**
- [x] Sett opp [Sentry](https://sentry.io) for feilsporing (`@sentry/nextjs`) — ferdig i Steg 17A
- [ ] Sett opp uptime monitoring (f.eks. [Better Uptime](https://betterstack.com) eller [UptimeRobot](https://uptimerobot.com))
- [ ] Aktiver Vercel Speed Insights og Web Analytics
- [ ] Vurder Vercel WAF (Web Application Firewall) for produksjonsprosjekter

---

### 11. Kjente produksjons-TODO

- [ ] **Nonce-basert CSP**: fjern `'unsafe-inline'` fra `script-src` — krever middleware-nonce og `<Script nonce>` i layout
- [ ] **Redis rate limiting**: erstatt in-memory `Map` med [Upstash Redis](https://upstash.com) (`@upstash/ratelimit`) for multi-instance garantier
- [x] **Supabase RLS**: plan og SQL klar i `docs/RLS_PLAN.md` + `supabase/policies/rls.sql` — aktiver etter staging-test
- [ ] **Ekte PWA-ikoner**: erstatt placeholder-ikoner i `public/icons/` med ekte bedriftsgrafikk
- [ ] **Supabase Auth rate limits**: verifiser at innebygd rate limiting er aktivert (Auth → Settings → Rate Limits)
- [ ] **npm audit**: kjør `npm audit --production` og oppdater pakker med kjente hull
- [ ] **Backup-rutine**: sett opp automatisk databasebackup (Supabase har innebygd daglig backup på Pro-plan)

## Backup, Restore og Driftsrutiner (Steg 16B)

### Hva som må sikres

| Asset | Kritisk? | Backup-ansvar |
|-------|----------|---------------|
| Postgres-database | ✅ Kritisk | Supabase (automatisk) + manuell pg_dump |
| Storage: `incident-attachments` | ✅ Kritisk | Manuell synkronisering |
| Storage: `documents` | ✅ Kritisk | Manuell synkronisering |
| Miljøvariabler og hemmeligheter | ✅ Kritisk | Vercel + passordbehandler |
| VAPID-nøkler | ✅ Kritisk | Passordbehandler (genereres kun én gang) |
| GitHub-repo | ✅ Kritisk | GitHub (distribuert) + lokale kloner |
| Resend API-nøkkel + domene-DNS | ✅ Kritisk | Resend-dashboardet + domenekonfigurasjon |
| Vercel deploy-settings | Middels | `vercel.json` i repo, env-vars i Vercel |
| Prisma-migreringer | ✅ Kritisk | I GitHub-repo under `prisma/migrations/` |

---

### RPO og RTO — anbefalte mål

| Mål | Anbefalt MVP | Forklaring |
|-----|-------------|------------|
| **RPO** (Recovery Point Objective) | 24 timer | Maks 24 timer med datatap aksepteres |
| **RTO** (Recovery Time Objective) | 4 timer | Systemet tilbake innen 4 timer etter hendelse |

> Disse målene er et MVP-utgangspunkt. Virksomheter med strenge krav (helse, offentlig sektor) bør vurdere RPO ≤ 1 time og RTO ≤ 1 time, noe som krever Supabase Pro-plan, kontinuerlig WAL-arkivering og automatiserte restore-tester.

---

### 1. Database-backup

#### 1.1 Supabase automatisk backup

Supabase tar automatiske daglige backups:

| Plan | Retention | Point-in-time restore |
|------|-----------|----------------------|
| Free | 7 dager | ❌ |
| Pro | 30 dager | ✅ (WAL, ned til minutt) |

Finn backups under **Supabase-dashboardet → Database → Backups**.

**Anbefaling:** Oppgrader til Pro-plan for produksjon for å få point-in-time restore og 30 dagers retention.

#### 1.2 Manuell backup med pg_dump

Kjør manuell backup jevnlig (ukentlig minimum) og alltid **før** en Prisma-migrering:

```bash
# Sett DIRECT_URL til session pooler-strengen (port 5432)
export PGPASSWORD="ditt-databasepassord"

# Full dump (custom format, komprimert)
pg_dump \
  --host=aws-0-eu-north-1.pooler.supabase.com \
  --port=5432 \
  --username=postgres.[ref] \
  --dbname=postgres \
  --format=custom \
  --no-acl \
  --no-owner \
  --file="hr-hms-backup-$(date +%Y%m%d-%H%M%S).dump"

# Verifiser filen
pg_restore --list hr-hms-backup-*.dump | head -20
```

**Oppbevar backup-filen sikkert** — se "Sikker håndtering av backups" under.

#### 1.3 Restore fra pg_dump

```bash
# Til eksisterende database (overskriver eksisterende data!)
pg_restore \
  --host=aws-0-eu-north-1.pooler.supabase.com \
  --port=5432 \
  --username=postgres.[ref] \
  --dbname=postgres \
  --no-acl \
  --no-owner \
  --clean \
  hr-hms-backup-YYYYMMDD-HHMMSS.dump

# Kjør alltid prisma migrate deploy etter restore for å verifisere migreringstilstand:
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy

# Verifiser at data er på plass:
DATABASE_URL="..." npx prisma studio
```

#### 1.4 Anbefalt backupfrekvens

| Frekvens | Metode |
|----------|--------|
| Daglig | Supabase automatisk (Pro) |
| Ukentlig | Manuell pg_dump til ekstern lagring |
| Alltid før migrering | Manuell pg_dump |
| Alltid etter viktige datainnlegg | Vurder manuell pg_dump |

---

### 2. Storage-backup

Supabase Storage (private buckets) har **ikke** automatisk backup. Filer må kopieres manuelt.

#### 2.1 Last ned filer fra bucket

Bruk Supabase CLI:

```bash
npm install -g supabase

# Logg inn
supabase login

# Koble til prosjekt
supabase link --project-ref din-project-ref

# Last ned hele bucket til lokal mappe
supabase storage cp --recursive \
  ss://incident-attachments/ \
  ./backup/storage/incident-attachments/

supabase storage cp --recursive \
  ss://documents/ \
  ./backup/storage/documents/
```

Alternativt via Supabase REST API med service role-nøkkel:

```bash
# List alle filer i en bucket
curl "https://din-project.supabase.co/storage/v1/object/list/incident-attachments" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1000, "prefix": ""}'
```

#### 2.2 Verifiser antall filer

```bash
# Tell filer i lokal backup
find ./backup/storage/incident-attachments -type f | wc -l
find ./backup/storage/documents -type f | wc -l

# Tell filer i databasen (kjør via prisma studio eller psql)
# SELECT COUNT(*) FROM "Attachment";
# SELECT COUNT(*) FROM "Document";
```

**Viktig:** Antall filer i Storage bør matche antall rader i `Attachment`- og `Document`-tabellene. Avvik kan indikere filer som ble lastet opp uten at metadata ble lagret, eller omvendt.

#### 2.3 Gjenopprette Storage-bucket

```bash
# Last opp fra lokal backup til (ny) bucket
supabase storage cp --recursive \
  ./backup/storage/incident-attachments/ \
  ss://incident-attachments/

supabase storage cp --recursive \
  ./backup/storage/documents/ \
  ss://documents/
```

#### 2.4 filePath-konsistens

Filstier i Postgres (`Attachment.filePath`, `Document.filePath`) **må** matche stier i Storage. Ved gjenoppretting til et nytt Supabase-prosjekt:

1. Gjenopprett database fra pg_dump (filstier beholdes som de er)
2. Last opp Storage-filer med **identisk mappestruktur**
3. Bytt ut `NEXT_PUBLIC_SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` med nye verdier
4. Test at signerte URL-er genereres korrekt (`/avvik/[id]` → vedlegg)

---

### 3. Restore-prosedyrer

#### Scenario A — Database-feil, Storage OK

```
Symptomer: app krasjer, Prisma-feil, data borte
Storage: filer intakte

1. Gå til Supabase → Database → Backups
2. Velg siste fungerende backup → "Restore"
   (alternativt: pg_restore fra manuell dump)
3. npx prisma migrate deploy (verifiser migreringstilstand)
4. Test app: innlogging, avvik, vedlegg → verifiser at filer lastes ned
5. Sjekk at filePath i Attachment/Document matcher Storage-filene
```

#### Scenario B — Storage-feil, Database OK

```
Symptomer: nedlasting av vedlegg/dokumenter feiler, 404 fra Storage
Database: Postgres intakt

1. Gjenopprett Storage fra siste manuell backup (supabase storage cp)
2. Verifiser at filsti-struktur er identisk med Postgres filPath-felt
3. Test signert URL-generering på et avvik og et dokument
4. Sjekk Supabase → Storage → incident-attachments og documents
```

#### Scenario C — Full restore til nytt Supabase-prosjekt

```
Scenario: eksisterende Supabase-prosjekt uopprettelig skadet

1. Opprett nytt Supabase-prosjekt (ny region/ref)
2. Hent nye API-nøkler og oppdater Vercel env-vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - DIRECT_URL
3. pg_restore til ny database (se 1.3 over)
4. npx prisma migrate deploy
5. Gjenopprett Storage-buckets (supabase storage cp)
6. Oppdater Auth → URL Configuration i nytt prosjekt
7. Redeploy Vercel (pull nye env-vars)
8. Kjør full smoke test (se produksjonsdeploy-seksjonen)
```

#### Scenario D — Feil deploy / rollback i Vercel

```
Scenario: ny deploy har introdusert en feil

1. Gå til Vercel → Deployments
2. Finn siste fungerende deployment
3. Klikk ⋯ → "Promote to Production"
   (tar ~30 sekunder, ingen databaseendring)
4. Verifiser at app fungerer
5. Undersøk feil i koden, fiks og redeploy
```

> **Merk:** Vercel-rollback ruller ikke tilbake databasemigreringer. Hvis en migrering introduserte problemet, kreves manuell database-restore i tillegg.

---

### 4. Sikker håndtering av backups

#### Lagring

- **Aldri** lagre backup-filer på samme server/prosjekt som produksjonsdatabasen
- Lagre krypterte backup-filer i minst to separate lokasjoner (f.eks. ekstern harddisk + kryptert sky)
- Anbefalt: [Backblaze B2](https://www.backblaze.com/b2/) eller [AWS S3 med kryptering](https://aws.amazon.com/s3/) for automatisert off-site backup

#### Kryptering

```bash
# Krypter pg_dump-fil med GPG før lagring
gpg --symmetric --cipher-algo AES256 hr-hms-backup-20240101-120000.dump
# Produserer: hr-hms-backup-20240101-120000.dump.gpg

# Dekrypter ved restore
gpg --decrypt hr-hms-backup-20240101-120000.dump.gpg > restore.dump
```

#### Tilgangsstyring

- Backup-filer skal kun være tilgjengelig for utpekte systemansvarlige
- Bruk passordbehandler (f.eks. 1Password, Bitwarden) for VAPID-nøkler, service role-nøkler og databasepassord
- **Aldri** send backup-filer, hemmeligheter eller env-filer på e-post, Slack eller andre ukrypterte kanaler

#### GDPR og personvern

Backup-filene inneholder persondata (ansattnavn, e-poster, fraværshistorikk, avviksbeskrivelser):

- Backup-filer er omfattet av **databehandleravtale** med Supabase (og eventuell sky-leverandør for off-site backup)
- Retention: slett backup-filer eldre enn 90 dager (eller tilpass til virksomhetens krav)
- Dokumenter hvem som har tilgang til backup-systemer
- Ved leverandørbytte: sørg for sletting av data hos gammel leverandør i henhold til GDPR art. 17

```bash
# Slett backup-filer eldre enn 90 dager (kjør manuelt eller som cron)
find ./backup/ -name "*.dump*" -mtime +90 -delete
```

---

### 5. Driftssjekklister

#### Ukentlig

```
□ Verifiser at Supabase automatisk backup er kjørt (Database → Backups)
□ Sjekk Vercel Logs → Functions for uventede feil (siste 7 dager)
□ Sjekk Supabase Logs → API og Auth for feilmønstre
□ Sjekk Resend → Emails for bounce-rate og leveranseproblemer
□ Test innlogging manuelt (EMPLOYEE, MANAGER, HR/ADMIN)
□ Test filopplasting på et avvik (vedlegg → signert URL fungerer)
□ Kjør manuell pg_dump og lagre sikkert
```

#### Månedlig

```
□ Test restore til staging-database (se "Restore-test" under)
□ Kjør npm audit --production og oppdater pakker med kritiske hull
□ Gjennomgå og roter hemmeligheter (VAPID-nøkler roteres sjelden, men
  sjekk at API-nøkler ikke er eksponert i logger)
□ Gjennomgå brukere og admin-tilganger i Supabase Auth
□ Sjekk Supabase Storage-forbruk (Dashboard → Storage → Usage)
□ Verifiser at alle buckets fortsatt er private
□ Eksporter AuditLog til CSV hvis ønskelig (via /rapporter)
□ Kjør full smoke test (se produksjonsdeploy-seksjonen)
□ Oppdater npm-pakker (patch/minor): npm update
```

#### Restore-test (månedlig)

Én gang per måned bør restore testes mot en staging-database for å bekrefte at backup er brukbar:

```bash
# 1. Opprett midlertidig Supabase-prosjekt (staging)
# 2. Hent connection string til staging

# 3. Restore siste pg_dump til staging
pg_restore \
  --host=staging-host.supabase.com \
  --port=5432 \
  --username=postgres.[staging-ref] \
  --dbname=postgres \
  --no-acl \
  --no-owner \
  hr-hms-backup-YYYYMMDD.dump

# 4. Kjør Prisma migrate deploy mot staging
DATABASE_URL="staging-url" npx prisma migrate deploy

# 5. Pek lokal .env.local midlertidig mot staging og kjør smoke test
# 6. Slett staging-prosjektet etter test
```

---

### 6. Kriseprosedyre (Incident Runbook)

Følg disse stegene ved produksjonshendelse:

```
1. OPPDAGELSE
   - Hvem oppdaget hendelsen? (bruker, monitor, varsel)
   - Hva er symptomet? (app nede, data borte, sikkerhetshendelse)
   - Tidspunkt for oppdagelse → noter i avviksmodulen

2. ISOLERING
   - Kan hendelsen begrenses? (sett Vercel-deployment på pause ved aktiv utnyttelse)
   - Identifiser omfang: én bruker, én avdeling, eller hele systemet?

3. VARSLING INTERNT
   - Varsle systemansvarlig og daglig leder
   - Dokumenter hendelsen fortløpende

4. VURDER PERSONVERNBRUDD
   - Er persondata eksponert, tapt eller kompromittert?
   - Hvis JA: vurder meldeplikt til Datatilsynet innen 72 timer (GDPR art. 33)
   - Kontakt personvernombud eller juridisk rådgiver

5. RESTORE
   - Identifiser riktig scenario (A/B/C/D over)
   - Gjennomfør restore-prosedyren
   - Test at systemet fungerer (smoke test)

6. VERIFISERING
   - Bekreft at data er intakt
   - Bekreft at sikkerhetsheaders er aktive
   - Bekreft at Auth fungerer

7. ETTERANALYSE
   - Hva var rotårsaken?
   - Hva kan forhindre samme hendelse?
   - Oppdater driftsrutiner og dokumentasjon

8. DOKUMENTASJON I AVVIKSMODULEN
   - Opprett et avvik i HR/HMS-systemet selv med:
     type: IT-hendelse / sikkerhetshendelse
     beskrivelse, tidsrom, omfang, tiltak
   - Legg til tiltak for å forhindre gjentakelse
```

---

### 7. Miljøvariabler og hemmeligheter — backup

Hemmeligheter lagres **ikke** i Git. Ta vare på disse separat:

| Hemmelig | Lagres i | Backup |
|----------|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + passordbehandler | Passordbehandler |
| `DATABASE_URL` / `DIRECT_URL` | Vercel + passordbehandler | Passordbehandler |
| `VAPID_PRIVATE_KEY` | Vercel + passordbehandler | Passordbehandler |
| `RESEND_API_KEY` | Vercel + passordbehandler | Passordbehandler |
| Supabase databasepassord | Passordbehandler | Passordbehandler |

**VAPID-nøkler er kritiske:** Hvis `VAPID_PRIVATE_KEY` mistes, må alle push-abonnementer slettes og alle brukere må re-abonnere. Generer aldri nye nøkler uten å ha den gamle lagret sikkert.

Eksporter env-variabler fra Vercel som kryptert fil og lagre i passordbehandler:

```bash
# List alle Vercel env-vars (ikke verdiene — kun navn)
vercel env ls

# Pull env-vars til lokal fil (til .env.local — aldri commit denne!)
vercel env pull .env.local.backup
# Krypter og lagre sikkert, slett ukryptert fil etterpå
gpg --symmetric .env.local.backup && rm .env.local.backup
```

## Pilotfase og Go Live (Steg 19)

### Dokumentasjon

| Fil | Innhold |
|-----|---------|
| [`docs/PILOT_EXECUTION_PLAN.md`](docs/PILOT_EXECUTION_PLAN.md) | 3-ukers pilotplan: onboarding, ukeplaner, måleparametere, feilhåndtering P0–P3 |
| [`docs/GO_LIVE_CHECKLIST.md`](docs/GO_LIVE_CHECKLIST.md) | Komplett Go Live-sjekkliste: infrastruktur, sikkerhet, drift, brukere, smoke test, go/no-go |
| [`docs/POST_PILOT_REVIEW.md`](docs/POST_PILOT_REVIEW.md) | Mal for pilotoppsummering og beslutning (Go Live / Ny pilot / Pause) |

### Lanseringsplan (T-minus)

| Tidspunkt | Aktivitet |
|-----------|-----------|
| T-14 dager | Staging-miljø klart, testbrukere invitert, seed kjørt |
| T-7 dager | Pilot uke 1 starter (onboarding), GO_LIVE_CHECKLIST påbegynt |
| T-3 dager | Pilot uke 2 ferdig, P0/P1-feil rettet, uke 3 starter |
| T-1 dag | Pilot uke 3 ferdig, POST_PILOT_REVIEW skrevet, go/no-go-møte |
| **T0 — Go Live** | GO_LIVE_CHECKLIST fullført, produksjonsdeploy, velkomst-e-post til brukere |
| T+1 dag | Sentry, Vercel og Supabase logs gjennomgått, pg_dump tatt |
| T+7 dager | Første driftssjekk, RLS fase 1 vurdert for produksjon |

### Teknisk gjeld — prioriteringsliste

#### Høy prioritet

| Tiltak | Filer |
|--------|-------|
| Supabase RLS fase 1 aktivert i produksjon | [`docs/RLS_PLAN.md`](docs/RLS_PLAN.md), [`supabase/policies/rls.sql`](supabase/policies/rls.sql) |
| Redis/Upstash rate limiting | `lib/security/rateLimit.ts` — erstatt in-memory Map |
| Nonce-basert CSP | `next.config.mjs` + `middleware.ts` + `app/layout.tsx` |

#### Middels prioritet

- Konfigurer UptimeRobot/Better Stack mot `/api/health`
- Ekte PWA-ikoner (erstatt `public/icons/*.png`)
- Automatisert månedlig restore-test mot staging
- Sentry Session Replay — verifiser at PII ikke lekkes

#### Backlog (fremtidige steg)

- Per-varseltype push-preferanser
- Daglig e-post-digest (i stedet for enkelt-varsler)
- Avanserte HMS-rapporter (PDF, diagram)
- Supabase RLS fase 2–3 (resterende tabeller)

### Videre roadmap

Etter Go Live og stabiliseringsperiode kan disse modulene vurderes:

| Modul | Beskrivelse |
|-------|-------------|
| Timeføring | Registrering og godkjenning av timer |
| Lønnsoversikt | Enkel lønnshistorikk (ikke utbetaling) |
| Kompetansekartlegging | Kurs, sertifikater, kompetanseprofil |
| NAV/Altinn-integrasjon | Automatisk fraværsmelding |
| Avansert HMS-rapportering | PDF-eksport, trenddiagram |
| Multi-tenant | Støtte for flere virksomheter |

---

## Supabase RLS (Steg 18B)

### Arkitekturkonklusjon

**Prisma bruker `postgres`-superbrukeren som alltid bypasser RLS.** RLS beskytter ikke Prisma/tRPC-ruter, men blokkerer direkte anon/authenticated Supabase-klienttilgang til tabeller — en reell angrepsvektor siden `NEXT_PUBLIC_SUPABASE_ANON_KEY` er eksponert i nettleserkoden.

Strategi: **Aktiver RLS med ingen permissive policies på alle tabeller.** Ingen appkodeendringer nødvendig.

### Filer

| Fil | Innhold |
|-----|---------|
| [`docs/RLS_PLAN.md`](docs/RLS_PLAN.md) | Full arkitekturanalyse, policy-design per tabell, faseplan, testplan |
| [`supabase/policies/rls.sql`](supabase/policies/rls.sql) | SQL for å aktivere RLS + rollback-kommandoer + verifiseringsqueries |

### Aktivering (kun etter staging-test)

```bash
# Test mot staging FØR produksjon
psql "$DIRECT_URL_STAGING" < supabase/policies/rls.sql

# Verifiser at Prisma/tRPC fortsatt fungerer (alle tester i README)
# Verifiser at anon-tilgang er blokkert:
curl "https://[staging-ref].supabase.co/rest/v1/Incident" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Forventer: 0 rader (ikke avviksdata)

# Deploy til produksjon kun etter godkjent staging-test
psql "$DIRECT_URL_PROD" < supabase/policies/rls.sql
```

Se [`docs/RLS_PLAN.md`](docs/RLS_PLAN.md) for komplett analyse og testplan.

---

## Brukertesting / UAT (Steg 18A)

### Dokumentasjon

| Fil | Innhold |
|-----|---------|
| [`docs/UAT.md`](docs/UAT.md) | UAT-plan: mål, pilotgruppe, testscenarier per rolle, go/no-go-kriterier |
| [`docs/UAT-feedback-template.md`](docs/UAT-feedback-template.md) | Mal for å rapportere funn med alvorlighetsgrad og reproduksjonssteg |
| [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md) | Kortfattet guide for pilotbrukere — hva som skal testes og hvordan rapportere |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | Sjekkliste for produksjonsrelease: kode, staging, backup, deploy, verifisering, rollback |

### Go/no-go — kortversjon

Klar for produksjon når:
- Ingen blokkerende eller kritiske RBAC-feil
- Innlogging, filopplasting og fraværsgodkjenning fungerer for alle roller
- CSV-eksport produserer korrekte filer
- Staging smoke test bestått
- Minst 4 av 6 pilotbrukere har fullført sine scenarier

### Feilklassifisering

| Nivå | Krever fix før prod? |
|------|---------------------|
| Blokkerende | ✅ Ja — stopper release |
| Kritisk | ✅ Ja — stopper release |
| Middels | Bør fikses, kan vurderes |
| Lav | Kan utsettes |
| Forbedringsforslag | Backlog |

---

## Staging-miljø og release-flyt (Steg 17B)

### Arkitektur

```
main  ──────────────────────────────────────► Vercel Production
                                              Supabase Production
                                              Resend Production
                                              Sentry env=production

staging ────────────────────────────────────► Vercel Preview (staging)
                                              Supabase Staging
                                              Resend test-modus
                                              Sentry env=staging

feature/xxx ────────────────────────────────► Vercel Preview (automatisk)
                                              (deler Supabase staging)
```

---

### 1. Branch-strategi

| Branch | Formål | Vercel-miljø | Database |
|--------|--------|-------------|----------|
| `main` | Produksjon — alltid releaseklar | Production | Supabase Prod |
| `staging` | Integrasjonstesting — siste feature-set | Preview | Supabase Staging |
| `feature/*` | Én feature/bugfix | Preview | Supabase Staging |

**Regler:**
- Ingen direktepush til `main` — bruk PR via `staging`
- `staging` merges inn i `main` kun etter godkjent smoke test
- Feature branches merges til `staging`, ikke direkte til `main`

---

### 2. Supabase staging-prosjekt

#### 2.1 Opprett prosjekt

1. Gå til [supabase.com](https://supabase.com) → **New project** (eget prosjekt, ikke kopi av prod)
2. Gi det et tydelig navn, f.eks. `hr-hms-staging`
3. Velg samme region som produksjon (f.eks. `eu-north-1`)

#### 2.2 Kjør migreringer

```bash
# Sett staging-tilkoblingsstrenger lokalt
export DATABASE_URL="postgresql://postgres.[staging-ref]:pass@....supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.[staging-ref]:pass@....supabase.com:5432/postgres"

# Kjør alle migreringer (første gang)
npx prisma migrate deploy

# Alternativt for staging — db:push er OK (ikke produksjon)
npx prisma db push
```

#### 2.3 Opprett buckets

Gjør det samme som i produksjon (se "Supabase Storage — oppsett"):
- `incident-attachments` — privat
- `documents` — privat

#### 2.4 Auth-konfigurasjon

Gå til **Authentication → URL Configuration** i staging-prosjektet:

| Felt | Verdi |
|------|-------|
| Site URL | `https://hr-hms-git-staging-din-org.vercel.app` |
| Redirect URLs | `https://hr-hms-git-staging-din-org.vercel.app/auth/callback` |

Legg også til wildcard for feature-branches:
```
https://*-din-org.vercel.app/auth/callback
```

#### 2.5 Opprett testbrukere

I Supabase Staging → **Authentication → Users → Add user** — opprett fire brukere:

| E-post | Passord | Rolle |
|--------|---------|-------|
| `admin@staging.example.com` | `Staging123!` | ADMIN |
| `hr@staging.example.com` | `Staging123!` | HR |
| `leder@staging.example.com` | `Staging123!` | MANAGER |
| `ansatt@staging.example.com` | `Staging123!` | EMPLOYEE |

Noter UUID-ene fra Supabase og oppdater `SUPABASE_USER_IDS` i [`prisma/seed.ts`](prisma/seed.ts).

#### 2.6 Kjør seed

```bash
# Sett staging DATABASE_URL i .env.local
npm run db:seed

# Verifiser i Prisma Studio
npm run db:studio
```

Seeden oppretter: 1 avdeling, 4 brukere, 2 avvik, 2 tiltak, 1 dokument (plassholder), 2 fraværssøknader.

---

### 3. Vercel — staging env-vars

Gå til **Vercel → Prosjekt → Settings → Environment Variables**.

Opprett separate verdier for **Preview**-scope som peker mot Supabase Staging:

| Variabel | Production | Preview (staging) |
|----------|-----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | prod-url | staging-url |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod-anon | staging-anon |
| `SUPABASE_SERVICE_ROLE_KEY` | prod-service-role | staging-service-role |
| `DATABASE_URL` | prod-db | staging-db |
| `DIRECT_URL` | prod-direct | staging-direct |
| `APP_URL` | `https://ditt-domene.no` | `https://hr-hms-git-staging-org.vercel.app` |
| `SENTRY_ENVIRONMENT` | `production` | `staging` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` | `staging` |
| `EMAIL_NOTIFICATIONS_ENABLED` | `true` | `false` |
| `PUSH_NOTIFICATIONS_ENABLED` | `true` | `false` |
| `VAPID_PUBLIC_KEY` | prod-vapid-pub | staging-vapid-pub (egne nøkler) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | prod-vapid-pub | staging-vapid-pub |
| `VAPID_PRIVATE_KEY` | prod-vapid-priv | staging-vapid-priv |

**Tips:** Generer egne VAPID-nøkler for staging med `npx web-push generate-vapid-keys`.

I Vercel kan du knytte env-vars til spesifikke preview-branches under **"Branch filter"**.

---

### 4. Prisma migration workflow

Komplett flyt fra utvikling til produksjon:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UTVIKLING (lokal)                                            │
│    git checkout -b feature/min-endring                          │
│    # Gjør schema-endringer i prisma/schema.prisma               │
│    npx prisma migrate dev --name beskriv_endringen              │
│    # Tester lokalt                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. STAGING                                                      │
│    git push origin feature/min-endring                          │
│    # Vercel lager preview deployment automatisk                 │
│    #                                                            │
│    # Kjør migrering mot staging:                                │
│    DATABASE_URL="staging-url" DIRECT_URL="staging-direct" \    │
│      npx prisma migrate deploy                                  │
│    #                                                            │
│    # Smoke test staging-URL                                     │
│    # Opprett PR: feature/min-endring → staging                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. MERGE TIL STAGING                                            │
│    git merge feature/min-endring → staging                      │
│    # Integrasjonstest på staging-branch deployment              │
│    # Godkjenn PR                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. PRODUKSJON                                                   │
│    # Ta backup av prod-database (alltid ved schema-endringer!)  │
│    pg_dump ... -f backup-$(date +%Y%m%d).dump                  │
│    #                                                            │
│    # Kjør migrering mot prod:                                   │
│    DATABASE_URL="prod-url" DIRECT_URL="prod-direct" \          │
│      npx prisma migrate deploy                                  │
│    #                                                            │
│    git merge staging → main                                     │
│    git push origin main                                         │
│    # Vercel deployer main automatisk                            │
│    #                                                            │
│    # Smoke test produksjon                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Nyttige kommandoer

```bash
# Lokal utvikling — oppretter migrasjonsfil og pusher til lokal DB
npx prisma migrate dev --name legg_til_felt_x

# Staging/Prod — kjør eksisterende migreringer (ingen nye SQL genereres)
npx prisma migrate deploy

# Se migreringshistorikk
npx prisma migrate status

# Inspiser hva en migrering gjør (les SQL-filen)
cat prisma/migrations/*/migration.sql

# Tilbakestill lokal dev-database (ALDRI mot prod/staging)
npx prisma migrate reset
```

#### Additive migreringer — unngå breaking changes

Skriv migreringer som er bakoverkompatible:

```sql
-- ✅ Bra: legg til nullable kolonne
ALTER TABLE "Incident" ADD COLUMN "resolvedAt" TIMESTAMP;

-- ✅ Bra: legg til ny tabell
CREATE TABLE "Tag" (...);

-- ⚠️ Farlig: rename kolonne — gjør i to steg (add → backfill → drop)
-- 1. migrate dev: legg til ny kolonne
-- 2. deploy + backfill data
-- 3. migrate dev: slett gammel kolonne

-- ❌ Aldri: slett kolonne med data i én operasjon
ALTER TABLE "Profile" DROP COLUMN "importantField";
```

---

### 5. Seed / testdata

Seeden finnes i [`prisma/seed.ts`](prisma/seed.ts).

```bash
# Kjør seed mot staging
DATABASE_URL="staging-url" npm run db:seed

# Eller med lokal .env.local satt til staging:
npm run db:seed
```

**Merk:** Dokumentet i seeden (`hms-handbok-2024.pdf`) oppretter en database-rad med plassholder-filsti, men laster ikke opp noen faktisk fil til Supabase Storage. Nedlastingslenken vil feile. Last opp en testfil manuelt via `/dokumenter/ny` etter seed for å teste Storage-integrasjonen.

---

### 6. Release-sjekkliste

#### Før merge til staging

```
□ npx tsc --noEmit                    # TypeScript-sjekk
□ npm run build                       # Produksjonsbygg
□ npm run lint                        # Lint
□ Les gjennom nye Prisma-migreringer  # Ingen breaking changes
□ Test RBAC: EMPLOYEE, MANAGER, HR, ADMIN på endret funksjonalitet
□ Test filopplasting og nedlasting (Supabase Storage)
□ Verifiser at nye env-vars er lagt til .env.example
```

#### Før deploy til produksjon

```
□ Ta manuell pg_dump av produksjonsdatabasen
□ Kjør prisma migrate deploy mot prod og verifiser ingen feil
□ Merge staging → main
□ Vent på Vercel-deploy (følg med i Vercel → Deployments)
□ Kjør smoke test mot produksjon (se smoke test-sjekkliste i Steg 16A)
□ Sjekk Sentry → Issues for nye feil etter deploy
□ Verifiser health endpoint: curl https://ditt-domene.no/api/health
□ Ha rollback-plan klar (Vercel: Promote siste deployment)
```

---

### 7. Rollback

#### Kode-rollback (ingen databaseendring)

```bash
# Vercel → Deployments → finn siste fungerende → ⋯ → Promote to Production
# Tar ~30 sekunder. Ingen databaseendring.
```

#### Med databaseendring (schema endret)

Prisma støtter ikke automatisk rollback av kjørte migreringer. Plan:

1. Vurder om endringen er additiv (ny kolonne/tabell kan beholdes)
2. Hvis ikke: restore fra pg_dump tatt før migrering
3. Gjør kode-rollback i Vercel
4. Kjør `prisma migrate deploy` for å synkronisere migreringstilstand med restoret DB

**Beste praksis — unngå rollback-situasjoner:**
- Skriv alltid additive migreringer (legg til, ikke slett/rename i én operasjon)
- Test alltid i staging med `prisma migrate deploy` før prod
- Hold migreringer små og fokuserte

---

### 8. Tilgjengelige scripts

```bash
npm run dev          # Utviklingsserver (SW ikke aktiv)
npm run build        # Produksjonsbygg (inkl. prisma generate)
npm start            # Produksjonsserver
npm run lint         # ESLint
npm run db:push      # Synkroniser schema → lokal/staging DB (dev-modus)
npm run db:migrate   # prisma migrate deploy (produksjon/staging)
npm run db:generate  # Generer Prisma Client
npm run db:studio    # Prisma Studio (GUI for database)
npm run db:seed      # Seed staging med testdata
```

## Observabilitet og overvåkning (Steg 17A)

### Sentry — feilsporing

`@sentry/nextjs` er installert og konfigurert for client, server og edge runtime.

#### Oppsett

```bash
npm install   # @sentry/nextjs er nå i package.json
```

1. Opprett prosjekt på [sentry.io](https://sentry.io) (velg **Next.js**)
2. Kopier DSN under **Settings → Client Keys (DSN)**
3. Hent auth-token under **Settings → Auth Tokens** (scope: `project:releases`, `org:read`)
4. Fyll inn i Vercel Environment Variables:

| Variabel | Scope | Verdi |
|----------|-------|-------|
| `SENTRY_DSN` | Production + Preview | Fra Sentry-dashboardet |
| `NEXT_PUBLIC_SENTRY_DSN` | Production + Preview | Samme verdi som `SENTRY_DSN` |
| `SENTRY_ENVIRONMENT` | Production | `production` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Production | `production` |
| `SENTRY_AUTH_TOKEN` | Production + Preview | For kildekartopplasting |
| `SENTRY_ORG` | Production + Preview | Sentry-organisasjonsnavn |
| `SENTRY_PROJECT` | Production + Preview | Sentry-prosjektnavn |

Sentry er valgfritt — hvis `SENTRY_DSN` ikke er satt, initialiseres ikke Sentry og appen kjører som normalt.

#### Personvern og datasikkerhet

Sensitiv HR-data scrubbes automatisk **før** feil sendes til Sentry:

- Request body scrubbes alltid (`[scrubbed]`) — inneholder tRPC-payload med beskrivelser, fraværsårsaker, lederkommentarer
- Query string scrubbes (kan inneholde tokens)
- Kjente sensitive felt (`email`, `description`, `reason`, `managerComment`, `p256dh`, `auth`, m.fl.) erstattes med `[redacted]`
- Session Replay har `maskAllText: true` og `blockAllMedia: true` — ingen skjerminnhold lagres

#### Tracing og Web Vitals

- `tracesSampleRate`: 20 % i produksjon, 100 % i dev
- Web Vitals (LCP, FID, CLS) rapporteres automatisk
- Tregeste transaksjoner synlige under Sentry → Performance

#### Filer

```
sentry.client.config.ts   # Client-side init + scrubbing + Session Replay
sentry.server.config.ts   # Server-side init + request body scrubbing
sentry.edge.config.ts     # Edge runtime init (middleware)
instrumentation.ts        # Next.js 14 hook — laster server/edge config ved oppstart
lib/monitoring/logger.ts  # Strukturert logger — sender errors til Sentry
```

#### Test Sentry lokalt

```bash
npm run build && npm start

# Generer en testfeil via Sentry-testknapp, eller kast manuelt:
# I en Server Component: throw new Error("Sentry test")
# Sjekk Sentry → Issues — feilen skal dukke opp innen sekunder

# Verifiser kildekart (stack trace skal vise TypeScript-linjer, ikke kompilert JS):
# Sentry → Issues → klikk feil → stack trace → TypeScript-kilde vises
```

---

### Strukturert logging — `lib/monitoring/logger.ts`

```ts
import { logger } from "@/lib/monitoring/logger";

// Bruk:
logger.info("Rapport eksportert", { type: "incidents", profileId: "xxx" });
logger.warn("Rate limit nådd", { userId: "xxx", action: "csvExport" });
logger.error("Push-sending feilet", error, { profileId: "xxx" });
```

- `info` / `warn`: kun console-output (JSON i produksjon, lesbar i dev)
- `error`: console-output + automatisk `Sentry.captureException`
- Sensitive felt redaktes automatisk (se liste over)
- Produksjonsformat: JSON — kompatibelt med Vercel Logs, Datadog, Logtail

---

### Health endpoint — `/api/health`

Maskinlesbar helsesjekk for uptime-monitorer:

```bash
curl https://ditt-domene.no/api/health
```

Eksempel respons (HTTP 200):
```json
{
  "status": "ok",
  "timestamp": "2024-06-12T10:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600.5,
  "db": { "status": "ok", "latencyMs": 12 },
  "latencyMs": 14
}
```

HTTP 503 med `"status": "degraded"` hvis database-ping feiler.

Bruk dette URL-et i UptimeRobot, Better Stack, Pingdom eller annen uptime-monitor.

---

### Systemside — `/admin/system`

Kun tilgjengelig for ADMIN-rolle. Viser:
- App-versjon og miljø
- Database-status og latens
- Antall brukere og aktive push-abonnementer
- Tjenestekonfigurasjon (e-post, push, Sentry aktiv/ikke)
- Lenke til `/api/health`

Nås via **Systemstatus**-lenken i sidebaren (kun synlig for ADMIN).

---

### Error Boundaries

| Fil | Dekker |
|-----|--------|
| `app/error.tsx` | Alle ruter — fanger feil i route-komponenter, viser referanse-ID |
| `app/global-error.tsx` | Root layout — kritiske feil, rendres uten Tailwind (eget `<html>`) |

Begge sender feilen til Sentry automatisk via `Sentry.captureException`.

---

### Uptime-overvåkning

Konfigurer en ekstern uptime-monitor mot `/api/health`:

| Tjeneste | Gratisnivå | Intervall | Varsel |
|----------|-----------|-----------|--------|
| [UptimeRobot](https://uptimerobot.com) | 50 monitorer | 5 min | E-post, Slack |
| [Better Stack](https://betterstack.com) | 10 monitorer | 3 min | E-post, SMS, PagerDuty |
| [Pingdom](https://pingdom.com) | Betalt | 1 min | E-post, Slack |

Anbefalt: konfigurer varsling til Slack-kanal eller e-post ved status != 200.

---

### Feilsøking

```bash
# Sjekk Vercel function logs
vercel logs --prod

# Sjekk database-tilkobling
curl https://ditt-domene.no/api/health | jq '.db'

# Sjekk Sentry error rate (siste 24 timer)
# Sentry → Projects → hr-hms-pwa → Issues → filter "Last 24h"

# Sjekk om Sentry-initialisering fungerer
# Server: se etter "Sentry initialized" i Vercel function logs (ikke lagt til, men can be added)
# Client: DevTools → Network → se etter requests til sentry.io eller /monitoring-tunnel

# Generer testfeil manuelt (dev)
npm run build && npm start
# Legg til throw new Error("test") i en side-komponent, last inn siden
```

## Kjente begrensninger / TODO

- **Workbox cacher ikke tRPC-svar** (`httpBatchLink` bruker POST, og POST-svar kan ikke lagres i Cache API). Offline-fallback for API-kall er ikke mulig uten å bytte til GET-basert transport eller IndexedDB-mellomlagring.
- **PWA-ikoner er placeholder** — erstatt `public/icons/*.png` med ekte grafikk før produksjon.
- **location-felt** er fjernet fra avviksskjema da det ikke finnes i databasemodellen. Kan legges til i Prisma-schema og tRPC-router i et fremtidig steg.

## Testkommandoer

```bash
# TypeScript-sjekk (ingen Node i CI — kjør lokalt med Node 18+)
npx tsc --noEmit

# Bygg produksjonsversjon
npm run build

# Start produksjonsserver
npm start

# Generer Prisma Client (etter schema-endringer)
npm run db:generate
```

## Etter Steg 8 – kjør db:push

Schema har fått `Notification` og `NotificationType`-enum.
Husk å kjøre `npm run db:push && npm run db:generate` etter pull.

## Etter Steg 6 – kjør db:push

Schema har fått `RiskAssessment`, `RiskItem`, `Action` og 5 nye enums.
Husk å kjøre `npm run db:push && npm run db:generate` etter pull.

## Etter Steg 5 – kjør db:push

Schema har fått `Document`, `DocumentReadConfirmation`, `DocumentCategory` og `DocumentVisibility`.
Husk å kjøre `npm run db:push && npm run db:generate` etter pull.

## Etter Steg 4 – kjør db:push

Schema har fått `Attachment`-modellen.
Husk å kjøre `npm run db:push && npm run db:generate` etter pull.

## Etter Steg 3 – kjør db:push

Schema har fått `Incident`, `AuditLog`, `IncidentSeverity` og `IncidentStatus`.
Husk å kjøre `npm run db:push && npm run db:generate` etter pull.

## Etter Steg 2 – kjør db:push

Schema har fått `ProfileStatus`-enum og `title`-felt på `Profile`.
Husk å kjøre `npm run db:push && npm run db:generate` før du starter appen.
