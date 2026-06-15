# RBAC-test – Sensitive moduler

> **Versjon:** 1.0 – Juni 2026  
> Dokumenterer tilgangskontroll (RBAC) for moduler med sensitive personopplysninger.  
> Testet per rolle: ADMIN, HR, MANAGER, EMPLOYEE

---

## 1. Medarbeidersamtaler (`/medarbeidersamtaler`, `EmployeeReview`)

### Tilgangsoversikt

| Operasjon | ADMIN | HR | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Liste alle samtaler | ✅ | ✅ | ✅ (kun eget dept) | ✅ (kun egne) |
| Se detaljer | ✅ | ✅ | ✅ (kun eget dept) | ✅ (kun egne) |
| Se `managerNotes` (sensitive ledernotater) | ✅ | ✅ | ✅ | ❌ returneres som `null` |
| Opprette samtale | ✅ | ✅ | ✅ | ❌ |
| Redigere `managerNotes` | ✅ | ✅ | ✅ | ❌ |
| Redigere `sharedNotes` (delte notater) | ✅ | ✅ | ✅ | ✅ (kun egne) |
| Endre status/agenda | ✅ | ✅ | ❌ | ❌ |
| Slette samtale | ✅ | ✅ | ❌ | ❌ |

### Implementasjon

- **Router:** `server/routers/review.ts` — `byId`-prosedyre stripper `managerNotes: null` for EMPLOYEE-rolle
- **Felt:** `managerNotes String? @db.Text` — aldri returnert til EMPLOYEE
- **Ingen RLS** — filtrering skjer i router (Prisma bypasser RLS)

### Teststeg

```
1. Logg inn som EMPLOYEE
2. Gå til /medarbeidersamtaler/[id] (din samtale)
3. Verifiser at managerNotes IKKE vises i respons (sjekk network-tab)
4. Logg inn som HR
5. Verifiser at managerNotes er synlig i detalj-respons
6. Test at EMPLOYEE ikke kan opprette ny samtale (POST → FORBIDDEN)
```

---

## 2. Advarsler / Personalsaker (`/admin/personalsaker`, `PersonnelCase`)

### Tilgangsoversikt

| Operasjon | ADMIN | HR | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Liste personalsaker | ✅ | ✅ | ✅ (kun eget dept) | ❌ FORBIDDEN |
| Se detaljer | ✅ | ✅ | ✅ (kun eget dept) | ❌ FORBIDDEN |
| Se `internalNote` (intern notat) | ✅ | ✅ | ❌ returneres som `null` | ❌ FORBIDDEN |
| Opprette sak | ✅ | ✅ | ✅ | ❌ |
| Redigere sak | ✅ | ✅ | ❌ | ❌ |
| Endre status | ✅ | ✅ | ❌ | ❌ |
| Slette sak | ❌ (ikke implementert) | ❌ | ❌ | ❌ |

### Implementasjon

- **Router:** `server/routers/personnelCase.ts`
- `list`: kaster FORBIDDEN direkte for EMPLOYEE
- `byId`: returnerer `{ ...c, internalNote: null }` for MANAGER
- `internalNote`: aldri vist til MANAGER eller EMPLOYEE
- Audit-logg på alle statusendringer (`PersonnelCaseAuditLog`)
- Varsler sendes uten sensitiv innhold — kun hendelsestype og lenke

### Teststeg

```
1. Logg inn som EMPLOYEE
2. GET /api/trpc/personnelCase.list → forventer FORBIDDEN (401/403)
3. GET /api/trpc/personnelCase.byId → forventer FORBIDDEN
4. Logg inn som MANAGER
5. GET /api/trpc/personnelCase.byId → verifiser at internalNote er null i respons
6. Logg inn som HR
7. GET /api/trpc/personnelCase.byId → verifiser at internalNote er synlig
```

---

## 3. Kontrakter (`/kontrakter`, `Contract`)

### Tilgangsoversikt

| Operasjon | ADMIN | HR | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Liste kontrakter | ✅ (alle) | ✅ (alle) | ✅ (kun eget dept) | ✅ (kun egne, hvis delt) |
| Se detaljer | ✅ | ✅ | ✅ (kun eget dept) | ✅ (kun egne + `sharedWithEmployee=true`) |
| Laste opp fil | ✅ | ✅ | ❌ | ❌ |
| Laste ned fil (signert URL) | ✅ | ✅ | ✅ | ✅ (kun egne + delt) |
| Del med ansatt (`share`) | ✅ | ✅ | ❌ | ❌ |
| Be om signatur | ✅ | ✅ | ❌ | ❌ |
| Signere/avslå (testmodus) | ❌ | ❌ | ❌ | ✅ (kun egne pending) |

### Lagring og sikkerhet

- **Bucket:** `contracts` — **privat bucket** (`public=false`)
- **Opplasting:** `createSignedUploadUrl()` — signert URL, bruker laster opp direkte til Supabase Storage
- **Nedlasting:** `createSignedUrl(fileKey, 300)` — URL utløper etter 300 sekunder
- **Ingen offentlige URL-er** — alle nedlastinger krever server-side signering

### Tilgang til ikke-delte kontrakter

- EMPLOYEE ser IKKE kontrakter med `sharedWithEmployee=false`
- Sidekode (`app/(dashboard)/kontrakter/[id]/page.tsx`) redirecter til `/ingen-tilgang` hvis `isEmployee && !c.sharedWithEmployee`

### Teststeg

```
1. Logg inn som EMPLOYEE
2. /kontrakter → verifiser at kontrakter uten sharedWithEmployee ikke vises
3. Forsøk å åpne /kontrakter/[id] for ikke-delt kontrakt → forventer redirect til /ingen-tilgang
4. Logg inn som HR, del kontrakten
5. Logg inn som EMPLOYEE igjen → kontrakten vises nå
6. Klikk "Last ned" → verifiser at URL er en signert Supabase-URL (inneholder token-parameter)
7. Verifiser at URL utløper (manuelt, etter 5 min → 403 fra Supabase)
```

---

## 4. Varsling om kritikkverdige forhold (`/varsle`, `WhistleblowingCase`)

### Tilgangsoversikt

| Operasjon | ADMIN | HR | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Sende varsling | ✅ | ✅ | ✅ | ✅ |
| Se egne varsler | ✅ | ✅ | ✅ | ✅ (kun egne) |
| Se alle varsler | ✅ | ✅ | ❌ | ❌ |
| Se varsleridentitet | ✅ | ✅ | ❌ | ❌ |
| Behandle/oppdatere status | ✅ | ✅ | ❌ | ❌ |
| Kommentere på varslingssak | ❌ | ❌ | ❌ | ❌ — ikke i scope |

### Viktige avgrensninger

- **CommentThread er IKKE lagt til varslingssaker** — bevisst valg
- Varslingsnotifikasjoner inneholder ikke sensitiv innhold, kun hendelsestype
- Ekstern anonym varslingsportal er ikke implementert — krever separat vurdering og DPIA

### Teststeg

```
1. Logg inn som EMPLOYEE
2. Send varsling via /varsle
3. Verifiser at kun egne varsler vises i listen
4. Forsøk å se /admin/varsling → forventer redirect
5. Logg inn som HR
6. Verifiser at alle varsler er synlige inkl. varsleridentitet
```

---

## 5. GDPR datainnsyn (`/personvern/foresporsler`, `DataSubjectRequest`)

### Tilgangsoversikt

| Operasjon | ADMIN | HR | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Sende forespørsel | ✅ | ✅ | ✅ | ✅ |
| Se egne forespørsler | ✅ | ✅ | ✅ | ✅ |
| Se alle forespørsler | ✅ | ✅ | ❌ | ❌ |
| Behandle forespørsel (fulfill/reject) | ✅ | ✅ | ❌ | ❌ |
| Se respons-notat | ✅ | ✅ | ❌ | ✅ (kun egne) |

### Lovkrav

- GDPR art. 15 (innsyn), art. 16 (retting), art. 17 (sletting), art. 20 (dataportabilitet)
- 30-dagers behandlingsfrist — spores i `resolvedAt`-felt

### Teststeg

```
1. Logg inn som EMPLOYEE
2. Send GDPR-forespørsel på /personvern
3. Verifiser at forespørselen vises med status PENDING
4. Logg inn som HR
5. Gå til /personvern/foresporsler → verifiser at alle forespørsler vises
6. Behandle forespørselen (fulfill/reject)
7. Logg inn som EMPLOYEE → verifiser at status er oppdatert
```

---

## Generelle RBAC-regler

| Regel | Implementasjon |
|---|---|
| Sensitive felt strippes i router, ikke DB | `managerNotes: null`, `internalNote: null` settes i `byId`-prosedyrer |
| Ingen sensitiv data i push-varsler eller e-post | Kun hendelsestype, navn, lenke — aldri felt-verdier |
| Audit-logg på statusendringer | `PersonnelCaseAuditLog`, hendelseslogg i WhistleblowingCase |
| Private storage-buckets | `contracts`-bucket har `public=false`, alle nedlastinger via signed URL |
| Kommentarer kun på avvik/tiltak/risiko | CommentThread IKKE på varslingssaker, personalsaker eller medarbeidersamtaler |

---

*Sist oppdatert: 2026-06-15*
