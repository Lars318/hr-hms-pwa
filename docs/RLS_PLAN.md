# RLS-plan — Supabase Row Level Security for HR/HMS PWA

## 1. Arkitekturanalyse — hvem aksesserer databasen?

Før RLS-policies designes er det kritisk å forstå hvilken PostgreSQL-rolle som faktisk kjører spørringer, fordi RLS bare gjelder roller som **ikke** har `BYPASSRLS`.

### Dataflyt i produksjon

```
Nettleser / PWA
    │
    ▼
Next.js App (Vercel)
    │
    ├─ tRPC-prosedyrer
    │       │
    │       ▼
    │   Prisma Client ──► PostgreSQL via DATABASE_URL
    │                        (postgres-superbruker med BYPASSRLS=TRUE)
    │
    ├─ Supabase Auth (@supabase/ssr)
    │       │
    │       ▼
    │   Supabase GoTrue ──► Kun sesjoner/tokens, ikke tabelldata
    │
    └─ Storage-operasjoner (server-side)
            │
            ▼
        Supabase Storage via SUPABASE_SERVICE_ROLE_KEY
            (service role med BYPASSRLS=TRUE)
```

### Nøkkelfunn

| Klient | PostgreSQL-rolle | BYPASSRLS? | RLS gjelder? |
|--------|-----------------|------------|-------------|
| Prisma via `DATABASE_URL` (port 6543) | `postgres` (superbruker) | ✅ Ja | ❌ Nei |
| Supabase service role (Storage) | `service_role` | ✅ Ja | ❌ Nei |
| `@supabase/ssr` — kun Auth | Ingen direkte tabell-SQL | — | — |
| Supabase anon key (direkte tabell-access) | `anon` | ❌ Nei | ✅ Ja |
| Supabase authenticated key (direkte tabell-access) | `authenticated` | ❌ Nei | ✅ Ja |

### Konklusjon

**RLS beskytter IKKE Prisma/tRPC-ruter.** Prisma kobler til via `postgres`-superbrukeren som alltid bypasser RLS, selv med `FORCE ROW LEVEL SECURITY`.

> Dette er standard oppførsel i PostgreSQL: «Superusers and roles with the BYPASSRLS attribute always bypass the row security system when accessing a table.» (PostgreSQL-dokumentasjon)

**RLS beskytter mot:**
1. **Direkte Supabase-klienttilgang** — noen som bruker `NEXT_PUBLIC_SUPABASE_ANON_KEY` og kaller `supabase.from('Incident').select()` direkte fra nettleseren
2. **Direkte PostgREST-kall** — REST-kall mot `https://[ref].supabase.co/rest/v1/Incident` med anon-token
3. **Fremtidig kode** som ved uhell bruker Supabase-klienten for dataaksess i stedet for tRPC
4. **Databaseadmin** som tester spørringer via Supabase Studio (autentisert bruker, ikke superbruker)

### Anbefalingen — Defense in Depth

Siden appen **aldri** bruker Supabase-klienten direkte mot tabeller (kun for auth), er den sikreste og enkleste strategien:

> **Aktiver RLS på alle tabeller uten permissive policies.**
> 
> Resultatet: `anon` og `authenticated` får tilgang til ingenting.
> Prisma og service role er upåvirket — de bypasser RLS uansett.

Dette lukker angrepsvektoren «noen bruker anon-nøkkelen til å lese tabelldata direkte» uten å kreve noen endring i applikasjonskoden.

---

## 2. SQL Helper-funksjoner — hvorfor de IKKE fungerer her

Det er vanlig å lage helper-funksjoner for RLS:

```sql
-- FUNGERER IKKE for Prisma — forklaring under
CREATE FUNCTION auth.current_profile_id() RETURNS text AS $$
  SELECT id FROM "Profile" WHERE "supabaseUserId" = auth.uid()::text
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**`auth.uid()` returnerer NULL** for Prisma-spørringer fordi:
- `auth.uid()` leser `current_setting('request.jwt.claims')` satt av PostgREST
- Prisma kobler direkte via PgBouncer uten JWT-context
- Ingen JWT → `auth.uid()` = NULL → alle policies som bruker `auth.uid()` evaluerer til false

Helper-funksjoner er kun nyttige hvis du bruker **PostgREST** (Supabase REST API) med autentiserte brukere. For Prisma er de irrelevante.

**Konklusjon: ikke lag role-baserte helper-funksjoner for dette prosjektet.** Deny-all er riktig strategi.

---

## 3. Policy-design per tabell

For hvert tabell: aktiver RLS med ingen permissive policies = deny all for anon/authenticated.
Prisma (postgres superbruker) er upåvirket.

| Tabell | Sensitiv data | RLS-strategi | Prioritet |
|--------|--------------|-------------|-----------|
| `Profile` | Høy (persondata, roller) | Deny all | Fase 1 |
| `Notification` | Middels (intern meldingsdata) | Deny all | Fase 1 |
| `PushSubscription` | Høy (endpoint, krypteringsnøkler) | Deny all | Fase 1 |
| `DocumentReadConfirmation` | Lav (hvem leste hva) | Deny all | Fase 1 |
| `AuditLog` | Høy (aktivitetslogg) | Deny all | Fase 2 |
| `LeaveRequest` | Høy (fraværsdata, årsaker) | Deny all | Fase 2 |
| `Incident` | Høy (HMS-data, beskrivelser) | Deny all | Fase 2 |
| `Attachment` | Middels (filmetadata) | Deny all | Fase 2 |
| `Document` | Middels (dokumentmetadata) | Deny all | Fase 2 |
| `Action` | Middels (tiltak, ansvarlige) | Deny all | Fase 3 |
| `RiskAssessment` | Høy (risikovurderinger) | Deny all | Fase 3 |
| `RiskItem` | Høy (risikodata) | Deny all | Fase 3 |
| `Department` | Lav (avdelingsstruktur) | Deny all | Fase 3 |

---

## 4. Supabase Storage-policies

Storage-buckets (`incident-attachments`, `documents`) er allerede satt til **private** (`is_public = false`). Dette blokkerer allerede offentlig HTTP-tilgang.

Supabase Storage bruker RLS på `storage.objects`-tabellen. Uten policies er standardoppførselen:
- Service role: full tilgang (bypasser RLS)
- Anon/authenticated: ingen tilgang (default deny når bucket er privat)

**Anbefaling:** Private buckets + ingen policies = effektivt deny all for anon/authenticated. Service role (brukt av tRPC/Prisma for signerte URL-er) er upåvirket.

For eksplisitt dokumentasjon kan følgende policies legges til:

```sql
-- Bekreft at ingen public tilgang eksisterer på storage.objects
-- (privat bucket = ingen SELECT-policy for anon/authenticated nødvendig)

-- Hvis du ønsker eksplisitt policy (valgfritt — privat bucket blokkerer allerede):
CREATE POLICY "Ingen public tilgang til incident-attachments"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Ingen public tilgang til documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'documents' AND false);
```

Disse er **valgfrie** siden private buckets allerede blokkerer anon/authenticated tilgang.

---

## 5. Fasevis aktivering

### Fase 0 — Nå (dokumentasjon og forberedelse)
- Les og forstå denne planen
- SQL-filen er klar i `supabase/policies/rls.sql`
- **Aktiver ingenting i produksjon ennå**
- Test SQL mot staging først

### Fase 1 — Staging-test (anbefales neste)
```
Tabeller: Profile, Notification, PushSubscription, DocumentReadConfirmation

Prosedyre:
1. Kjør rls.sql fase 1-seksjonen mot staging-database
2. Test alle tRPC-endepunkter som bruker disse tabellene:
   - /varsler (Notification)
   - /varsler → PushNotificationSettings (PushSubscription)
   - /dokumenter (DocumentReadConfirmation)
   - /ansatte (Profile)
3. Verifiser at appen fortsatt fungerer normalt
4. Prøv direkte Supabase-klientkall med anon-nøkkelen → skal feile med 403
5. Dokumenter resultat
```

### Fase 2 — Staging (resten av datatabeller)
```
Tabeller: AuditLog, LeaveRequest, Incident, Attachment, Document

Prosedyre: identisk med Fase 1
```

### Fase 3 — Staging (resterende tabeller)
```
Tabeller: Action, RiskAssessment, RiskItem, Department

Prosedyre: identisk med Fase 1
```

### Fase 4 — Produksjonsdeploy
```
Kun etter fullstendig staging-test og godkjent smoke test.
Kjør rls.sql mot produksjonsdatabasen:

DIRECT_URL="..." psql < supabase/policies/rls.sql
```

---

## 6. Testplan

### Positiv test — Prisma/tRPC virker fortsatt

```bash
# Etter at RLS er aktivert i staging:
# Logg inn som alle 4 roller og verifiser normal funksjonalitet

# EMPLOYEE:
□ Opprett avvik → vises i /avvik
□ Se varsler → vises i /varsler
□ Send fraværssøknad → vises i /fravaer

# MANAGER:
□ Se avdelingens avvik
□ Godkjenn fraværssøknad

# HR:
□ Se alle dokumenter inkl. PRIVATE
□ Eksporter CSV-rapport
□ Se alle fraværssøknader

# ADMIN:
□ Systemside (/admin/system) viser korrekte tall
□ Health endpoint: /api/health → db.status: ok
```

### Negativ test — anon-tilgang blokkert

```bash
# Test at direkte Supabase-klientkall med anon-nøkkel feiler:

# Med curl mot PostgREST:
curl "https://[staging-ref].supabase.co/rest/v1/Incident" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Forventer: 200 med tom array {} eller 403 Forbidden

# Med Supabase JS-klient (kjør i nettleser console på staging):
const { data, error } = await supabase.from('Incident').select('*');
console.log(data, error);
# Forventer: data = [] (RLS blokkerer) eller error = "permission denied"
```

### Test at Supabase Auth fortsatt fungerer

RLS påvirker IKKE `auth`-skjemaet (Supabase GoTrue). Innlogging, sesjoner og token-refresh er upåvirket av table-RLS.

---

## 7. Hva som ikke bør endres

- **Eksisterende tRPC RBAC-logikk berøres ikke** — RLS er et separat lag
- **Prisma-queries berøres ikke** — postgres-superbruker bypasser RLS
- **Supabase Auth berøres ikke** — opererer i eget `auth`-skjema
- **Storage-signerte URL-er berøres ikke** — server-side service role bypasser RLS

---

## 8. Oppsummering

| Spørsmål | Svar |
|---------|------|
| Beskytter RLS Prisma-ruter? | **Nei** — postgres-superbruker bypasser alltid RLS |
| Hva beskytter RLS mot? | Direkte anon/authenticated Supabase-klientkall mot tabeller |
| Er anon-nøkkelen eksponert? | Ja — `NEXT_PUBLIC_SUPABASE_ANON_KEY` er synlig i nettleseren |
| Er direkte tabell-aksess mulig uten RLS? | Ja — uten RLS kan anon-nøkkelen lese alle tabeller via PostgREST |
| Endres appkoden? | **Nei** — ingen endringer i tRPC, Prisma eller UI |
| Er det trygt å aktivere? | Ja, med forbehold om staging-test først |
| Kan det angres? | Ja — `ALTER TABLE "Incident" DISABLE ROW LEVEL SECURITY;` |

---

*SQL for aktivering: [`supabase/policies/rls.sql`](../supabase/policies/rls.sql)*
