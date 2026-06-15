# Produksjonsdata-oppsett – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> Beskriver hvordan produksjonsdatabasen settes opp med ekte brukere og organisasjonsdata.  
> **Gjelder kun produksjonsmiljø. Seed-script skal ALDRI kjøres mot produksjon.**

---

## 1. Hva som IKKE skal gjøres i produksjon

```
❌ npm run db:seed          – Oppretter testdata, testbrukere og fiktive avvik
❌ prisma db push --force-reset  – Sletter all data og re-migrerer
❌ Testpassord (f.eks. "password123")
❌ Testbrukernavn (f.eks. "Test Bruker", "Lars Test")
❌ Kopier av dev-data inn i prod
```

---

## 2. Databasemigrering (engangsoppsett)

> ✅ **Baseline-migrasjon er opprettet og committet** (`prisma/migrations/20260615000000_baseline/`).
> `prisma migrate deploy` fungerer nå i produksjon.

### Produksjonsmigrering

```bash
# Sett DATABASE_URL til prod-connection string (transaction pooler, port 6543)
# Kjøres mot PROD-database:
DATABASE_URL="postgresql://postgres.[ref]:[pw]@...:6543/postgres?pgbouncer=true" \
  npx prisma migrate deploy

# Verifiser
DATABASE_URL="<prod-url>" npx prisma migrate status
# → Forventer: "1 migration found. Database schema is up to date!"
```

### Fremtidige skjemaendringer

```bash
# 1. Gjør endring i prisma/schema.prisma
# 2. Lag migrasjonsfil i DEV (mot dev-database):
npx prisma migrate dev --name <beskrivelse>
# → Oppretter prisma/migrations/<timestamp>_<beskrivelse>/migration.sql

# 3. Commit og push migrations/-mappen til Git

# 4. I produksjon:
npx prisma migrate deploy
```

### Forbudt i produksjon

```
❌ prisma db push --force-reset   (sletter all data)
❌ prisma migrate dev              (bare for dev — kan trigge seed)
❌ npm run db:seed                 (seed er kun for dev/test)
```

---

## 3. Opprett første ADMIN-bruker

Gjøres via Supabase Auth-dashboardet og direkte databasekall – **ikke via seed-script**.

### Steg 1 – Opprett bruker i Supabase Auth

1. Gå til Supabase → Authentication → Users
2. Klikk «Invite user» (sender e-post med innloggingslenke)
   - Eller: «Add user» med e-post + midlertidig passord
3. Bruker logger inn og bytter passord

### Steg 2 – Opprett Profile-rad

Etter at brukeren har logget inn første gang (Supabase oppretter auth.users-rad), opprett profil:

```sql
-- Kjøres i Supabase → SQL Editor
INSERT INTO "Profile" (id, "supabaseUserId", email, "fullName", role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '<auth.users UUID fra Supabase Auth>',
  'admin@pulsfollo.no',
  'Systemadministrator',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

> Erstatt `<auth.users UUID>` med faktisk UUID fra Supabase → Authentication → Users.

---

## 4. Opprett lokasjoner

```sql
-- Eksempel for to treningssentre
INSERT INTO "Location" (id, name, address, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Ski Treningssenter', 'Idrettsveien 1, 1400 Ski', NOW(), NOW()),
  (gen_random_uuid()::text, 'Vestby Treningssenter', 'Sentrumsveien 5, 1540 Vestby', NOW(), NOW());
```

Alternativt: ADMIN-bruker oppretter lokasjoner via `/lokasjoner` i appen etter første innlogging.

---

## 5. Opprett avdelinger (valgfritt)

Avdelinger er støttestruktur. Lokasjoner er primær org-enhet.

```sql
INSERT INTO "Department" (id, name, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Resepsjon', NOW(), NOW()),
  (gen_random_uuid()::text, 'PT og coaching', NOW(), NOW()),
  (gen_random_uuid()::text, 'Renhold', NOW(), NOW());
```

---

## 6. Opprett pilotbrukere

For hver ansatt:

### Steg 1 – Inviter via Supabase Auth
- Supabase → Authentication → Invite User → skriv inn e-postadresse
- Supabase sender invitasjons-e-post med oppsettslenke

### Steg 2 – Opprett Profile

```sql
INSERT INTO "Profile" (id, "supabaseUserId", email, "fullName", title, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '<auth.users UUID>',
  'ansatt@pulsfollo.no',
  'Fornavn Etternavn',
  'Stillingstittel',
  'EMPLOYEE',   -- ADMIN | HR | MANAGER | EMPLOYEE
  'ACTIVE',
  NOW(),
  NOW()
);
```

### Steg 3 – Knytt til lokasjon

```sql
INSERT INTO "ProfileAssignment" (id, "profileId", "locationId", "isPrimary", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  '<profile UUID>',
  '<location UUID>',
  true,
  NOW(),
  NOW()
);
```

### Rollefordeling for pilot

| Rolle | Rettigheter | Hvem |
|---|---|---|
| ADMIN | Full tilgang inkl. systemadmin | IT-ansvarlig |
| HR | Full HR-tilgang, ikke systemadmin | HR-leder |
| MANAGER | Godkjenning, egne ansatte, avdeling | Avdelingsleder per treningssenter |
| EMPLOYEE | Egne data, avvikmelding, fravær, overtid | Alle øvrige ansatte |

---

## 7. Sett verneombud og HMS-ansvarlig

I appen (ADMIN): `/lokasjoner/[id]` → rediger → velg verneombud og HMS-ansvarlig.

Eller via SQL:

```sql
UPDATE "Location"
SET "safetyRepresentativeId" = '<profile UUID for verneombud>',
    "hseManagerId" = '<profile UUID for HMS-ansvarlig>',
    "updatedAt" = NOW()
WHERE id = '<location UUID>';
```

---

## 8. Verifisér at ingen testdata er i produksjon

Sjekk at disse tabellene er tomme eller kun inneholder ekte data:

```sql
-- Skal kun finne ekte brukere, ikke testbrukere
SELECT email, role FROM "Profile" ORDER BY "createdAt";

-- Skal være tom hvis seed ikke er kjørt
SELECT COUNT(*) FROM "Incident";
SELECT COUNT(*) FROM "RiskAssessment";
SELECT COUNT(*) FROM "LeaveRequest";
SELECT COUNT(*) FROM "OvertimeEntry";

-- Sjekk at ingen testkontrakter finnes
SELECT COUNT(*) FROM "Contract";
```

---

## 9. Fjerne testbrukere (hvis de havnet i prod ved uhell)

```sql
-- Slett profil (fjerner alle relasjoner via cascade – verifiser schema)
DELETE FROM "Profile" WHERE email LIKE '%test%' OR "fullName" LIKE '%test%';

-- Fjern auth-bruker i Supabase → Authentication → Users → Delete
-- (kan ikke gjøres via SQL direkte på auth.users uten service_role)
```

---

## 10. Etter oppsett – verifiser

```
□ Alle pilotbrukere kan logge inn
□ Rollene er korrekte (EMPLOYEE ser ikke admin-sider)
□ Primærlokasjon er satt for alle ansatte
□ Verneombud er definert per lokasjon
□ HMS-ansvarlig er definert per lokasjon
□ Ingen seed-data eller testdata er synlig
□ /api/health returnerer 200 OK
```

---

*Sist oppdatert: 2026-06-15*
