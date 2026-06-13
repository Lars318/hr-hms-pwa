# UAT — Brukertestplan for HR/HMS PWA

## Mål

Verifisere at HR/HMS PWA er klar for produksjonssetting ved å la faktiske sluttbrukere teste systemet i et realistisk staging-miljø. Testen skal avdekke funksjonelle feil, RBAC-avvik, brukbarhetsproblemer og mangler i brukeropplevelsen.

---

## Testmiljø

| Parameter | Verdi |
|-----------|-------|
| URL | `https://hr-hms-git-staging-din-org.vercel.app` |
| Database | Supabase Staging (eget prosjekt, ingen produksjonsdata) |
| E-post | Deaktivert (`EMAIL_NOTIFICATIONS_ENABLED=false`) |
| Push | Deaktivert (`PUSH_NOTIFICATIONS_ENABLED=false`) |
| Testdata | Seed fra `prisma/seed.ts` |

Alle testbrukere bruker anonyme testdata. Ingen ekte personopplysninger legges inn.

---

## Testbrukere

| Bruker | E-post | Passord | Rolle |
|--------|--------|---------|-------|
| Admin | `admin@staging.example.com` | `Staging123!` | ADMIN |
| HR-ansvarlig | `hr@staging.example.com` | `Staging123!` | HR |
| Avdelingsleder | `leder@staging.example.com` | `Staging123!` | MANAGER |
| Ansatt 1 | `ansatt@staging.example.com` | `Staging123!` | EMPLOYEE |
| Ansatt 2 | (opprett i Supabase Auth + Profile) | `Staging123!` | EMPLOYEE |
| HMS-ansvarlig | (bruk HR-brukeren eller opprett egen) | `Staging123!` | HR |

---

## Pilotgruppe

| Rolle i virksomheten | Systemrolle | Antall |
|---------------------|-------------|--------|
| Systemansvarlig / IT | ADMIN | 1 |
| HR-leder | HR | 1 |
| HMS-ansvarlig | HR | 1 |
| Avdelingsleder | MANAGER | 1 |
| Ansatt (kontorjobb) | EMPLOYEE | 1 |
| Ansatt (mobil/felt) | EMPLOYEE | 1 |

Totalt: 6 pilotbrukere.

---

## Tidsplan (forslag)

| Fase | Varighet | Aktivitet |
|------|----------|-----------|
| Forberedelse | 2 dager | Sett opp staging, seed data, inviter testbrukere |
| Opplæring | 1 time | Gjennomgang av system og testscenarier |
| Selvstendig testing | 3–5 dager | Testbrukere gjennomfører scenarier og rapporterer |
| Gjennomgang | 1 dag | Feil klassifiseres og prioriteres |
| Feilretting | Avhenger av funn | Blokkerende og kritiske feil rettes |
| Go/no-go | 1 møte | Beslutning om produksjonssetting |

---

## Feilklassifisering

| Alvorlighet | Definisjon | Eksempel | Krever fix før prod? |
|-------------|-----------|---------|---------------------|
| **Blokkerende** | Funksjonalitet er ubrukelig, data kan gå tapt, sikkerhetsproblem | Kan ikke logge inn, RBAC-feil som gir tilgang til feil data, filopplasting feiler alltid | ✅ Ja — stopper release |
| **Kritisk** | Viktig funksjon er brutt, men workaround finnes | Push-varsler virker ikke, CSV-eksport tom | ✅ Ja — stopper release |
| **Middels** | Funksjon er delvis brutt eller forvirrende, men ikke blokkerende | Feil dato-format, varsel mangler lenke | Bør fikses, men kan vurderes |
| **Lav** | Kosmetisk feil, liten UX-ulempe | Skrivefeil, ikon passer ikke, farge gal | Kan utsettes |
| **Forbedringsforslag** | Funksjonalitet fungerer, men kan gjøres bedre | Ønsker sortering, raskere søk, mobilvisning | Loggføres som backlog |

---

## Testscenarier

### ADMIN

#### A1 — Innlogging og systemstatus
1. Gå til staging-URL
2. Logg inn med `admin@staging.example.com`
3. Verifiser: redirectes til `/dashboard`
4. Klikk **Systemstatus** i sidebaren
5. Verifiser: database-status vises som OK, app-versjon og miljø vises

**Godkjent:** Innlogging OK, systemstatus viser green status

#### A2 — Administrere ansatte
1. Gå til `/ansatte`
2. Klikk **Ny ansatt** — fyll inn testdata (fiktivt navn, testdomene-e-post)
3. Rediger den nye ansatten — endre tittel
4. Verifiser at ansatten vises i listen

**Godkjent:** Opprett, rediger og list opp fungerer

#### A3 — Administrere avdelinger
1. Gå til `/admin/avdelinger`
2. Opprett ny avdeling
3. Rediger avdelingen
4. Verifiser at avdelingen kan knyttes til en ansatt

**Godkjent:** Avdelinger fungerer

#### A4 — Rapporter (full tilgang)
1. Gå til `/rapporter`
2. Test alle 5 fanene: Avvik, Tiltak, Risiko, Dokumentlesing, Fravær
3. Eksporter CSV for minst to rapporttyper
4. Åpne CSV i Excel — verifiser norske tegn og semikolon-separator

**Godkjent:** CSV åpnes korrekt i norsk Excel, alle fanene gir data

---

### HR

#### H1 — Dokumentarkiv
1. Logg inn som `hr@staging.example.com`
2. Gå til `/dokumenter` — verifiser at HMS-håndbok fra seed vises
3. Klikk **Nytt dokument** — last opp en PDF (testfil)
4. Åpne dokumentet — klikk **Last ned** — verifiser at nedlasting fungerer
5. Klikk **Bekreft lest** som HR-brukeren

**Godkjent:** Opplasting, nedlasting og lesebekreftelse fungerer

#### H2 — Fraværsgodkjenning
1. Logg inn som `ansatt@staging.example.com`
2. Gå til `/fravaer/ny` — opprett en feriesøknad (fremtidig dato)
3. Logg ut — logg inn som `hr@staging.example.com`
4. Gå til `/fravaer` — finn søknaden
5. Klikk **Godkjenn**

**Godkjent:** Søknad endrer status til APPROVED

#### H3 — Ansattoversikt og RBAC
1. Som HR: verifiser at `/ansatte` viser alle ansatte (ikke bare egen avdeling)
2. Verifiser at `/rapporter` viser avdelingsfilter
3. Opprett en PRIVATE-dokument — verifiser at kun HR/ADMIN kan se det

**Godkjent:** HR-rollen har korrekt tilgang

#### H4 — Varsler
1. Som HR: åpne varselklokkeikonet øverst
2. Verifiser at varsler fra seed/testhandlinger vises
3. Klikk et varsel — verifiser at det navigerer til riktig side og markeres som lest
4. Gå til `/varsler` — klikk **Merk alle som lest**

**Godkjent:** Varsler fungerer, badge forsvinner etter "merk alle"

---

### MANAGER

#### M1 — Avvik i egen avdeling
1. Logg inn som `leder@staging.example.com`
2. Gå til `/avvik` — verifiser at kun avvik i lederens avdeling vises
3. Endre status på et avvik

**Godkjent:** Kun avdelingens avvik vises, statusendring fungerer

#### M2 — Fraværsgodkjenning (MANAGER)
1. Logg inn som `ansatt@staging.example.com` — opprett fraværssøknad
2. Logg inn som `leder@staging.example.com` — godkjenn søknaden
3. Verifiser at MANAGER ikke kan godkjenne egne søknader
4. Opprett en søknad som MANAGER — prøv å godkjenne → skal avvises

**Godkjent:** MANAGER kan godkjenne andres søknader, ikke egne

#### M3 — Fraværskalender
1. Gå til `/fravaer/kalender`
2. Verifiser månedsvisning og årsvisning
3. Verifiser at kun avdelingens fravær vises (ikke andres)

**Godkjent:** Kalender viser riktig data for avdelingen

#### M4 — Rapporter (begrenset)
1. Gå til `/rapporter`
2. Verifiser at avdelingsfilter **ikke** vises (MANAGER ser kun sin avdeling)
3. Eksporter CSV — verifiser at kun avdelingsdata er med

**Godkjent:** Rapporten inneholder kun avdelingsdata

---

### EMPLOYEE

#### E1 — Rapportere avvik
1. Logg inn som `ansatt@staging.example.com`
2. Gå til `/avvik/ny`
3. Fyll inn tittel, beskrivelse, alvorlighetsgrad
4. Klikk **Send**
5. Verifiser at avviket vises i `/avvik`

**Godkjent:** Avvik opprettes og vises

#### E2 — Last opp vedlegg
1. Åpne avviket fra E1
2. Last opp en PDF-fil som vedlegg
3. Klikk nedlastingsikonet — verifiser at filen lastes ned (signert URL)

**Godkjent:** Vedlegg lastes opp og ned uten feil

#### E3 — Lese dokument og bekrefte lest
1. Gå til `/dokumenter`
2. Åpne HMS-håndboken
3. Klikk **Last ned** — verifiser nedlasting
4. Klikk **Bekreft lest**
5. Verifiser at grønn hake vises i dokumentlisten

**Godkjent:** Lesebekreftelse fungerer

#### E4 — Fraværssøknad
1. Gå til `/fravaer/ny`
2. Velg type **Ferie**, sett fremtidige datoer
3. Klikk **Send søknad**
4. Verifiser at søknaden vises som PENDING i `/fravaer`
5. Prøv å godkjenne din egen søknad — skal avvises

**Godkjent:** Søknad opprettet, selvgodkjenning blokkert

#### E5 — Offline-kladd
1. Åpne DevTools → Network → sett **Offline**
2. Gå til `/avvik/ny`
3. Verifiser at gul banner vises
4. Fyll inn avvik og klikk **Lagre som kladd**
5. Sett nett tilbake — verifiser at kladden synkroniseres

**Godkjent:** Offline-kladd lagres og synkroniseres

#### E6 — Push-varsler (krever produksjonsbygg)
1. Gå til `/varsler`
2. Klikk **Aktiver push** — godta nettleserens tillatelsesdialog
3. Klikk **Send testvarsel** — verifiser at push-varsel vises i OS

**Godkjent:** Push aktiveres, testvarsel mottas

#### E7 — PWA-installasjon
1. Åpne staging-URL i Chrome (desktop)
2. Klikk **Installer**-ikonet i adressefeltet (eller TopBar-knappen)
3. Verifiser at appen åpner i standalone-modus (ingen nettleserkrom)
4. Test navigasjon i installert app

**Godkjent:** Appen installeres og kjører som PWA

---

### HMS-spesifikke scenarier

#### HMS1 — Risikovurdering
1. Logg inn som HR eller MANAGER
2. Gå til `/risiko/ny` — opprett risikovurdering
3. Legg til risikopunkt med likelihood=4, impact=4 → score=16 (HIGH)
4. Legg til tiltak på risikopunktet

**Godkjent:** Risikovurdering opprettes, score beregnes korrekt

#### HMS2 — Tiltaksoversikt
1. Gå til `/tiltak` som EMPLOYEE — verifiser at kun egne tiltak vises
2. Som MANAGER — verifiser at avdelingens tiltak vises
3. Endre tiltaksstatus til **Fullført**

**Godkjent:** RBAC for tiltak fungerer korrekt

#### HMS3 — HMS-rapporter
1. Som HR: gå til `/rapporter` → **Avvik**-fanen
2. Filter på datointervall
3. Eksporter CSV

**Godkjent:** Rapport inneholder korrekte data, CSV er lesbar

---

## Go/no-go-kriterier

### Godkjent for produksjon når:

```
□ Ingen blokkerende feil gjenstår
□ Ingen kritiske RBAC-feil (data fra feil avdeling/rolle lekker ikke)
□ Innlogging fungerer for alle 4 roller
□ Filopplasting og nedlasting (Supabase Storage) fungerer
□ Fraværsgodkjenning fungerer (MANAGER/HR kan godkjenne, ikke egne)
□ CSV-eksport produserer korrekte filer
□ In-app varsler fungerer
□ Prisma migrate deploy er testet mot staging
□ Backup er dokumentert og testet
□ Staging smoke test fullført uten blokkerende feil
□ Minst 4 av 6 pilotbrukere har fullført sine scenarier
□ Alle blokkerende og kritiske funn er lukket eller akseptert
```

### Stoppes hvis:

- EMPLOYEE kan lese andre ansattes data
- MANAGER kan lese data utenfor sin avdeling
- Autentisering kan omgås
- Filopplasting feiler konsekvent
- Databasefeil ved vanlig bruk

---

## Tilbakemelding

Bruk malen i [`docs/UAT-feedback-template.md`](UAT-feedback-template.md) for å rapportere funn.

Samle tilbakemeldinger i et felles dokument eller feilsporingsverktøy (GitHub Issues, Linear, Jira).
