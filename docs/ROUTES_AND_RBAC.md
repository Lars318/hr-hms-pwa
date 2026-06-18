# Ruter og RBAC-oversikt – HR/HMS PWA

> **Dato:** 2026-06-14  
> **Roller:** ADMIN · HR · MANAGER · EMPLOYEE  
> **HMS-rolle:** ikke separat Prisma-rolle — HR-brukere med «hms» i title får HMS-fokusert dashboard

---

## Hovednivå-ruter

| Rute | Formål | Roller med tilgang | Faktisk tilgang i kode | Avvik | Mobilklar |
|---|---|---|---|---|---|
| `/dashboard` | Rollebasert oversikt | Alle | Alle autentiserte | Ingen | ✅ |
| `/ansatte` | Ansattregister | ADMIN, HR | ADMIN, HR (`hrProcedure`) | Ingen | ✅ |
| `/avvik` | Avvikshåndtering | Alle | Alle (`profileProcedure`) + RBAC i router | Ingen | ✅ |
| `/avvik/ny` | Rapporter nytt avvik | Alle | Alle | Ingen | ✅ |
| `/avvik/[id]` | Avviksdetalj | Alle (m/RBAC) | EMPLOYEE: egne · MANAGER: avdeling · HR/ADMIN: alle | Ingen | ✅ |
| `/risiko` | Risikovurderinger | ADMIN, HR, MANAGER | `profileProcedure` + rollefilter | Ingen | ✅ |
| `/tiltak` | Tiltaksliste | Alle | Alle (`profileProcedure`) | Ingen | ✅ |
| `/dokumenter` | Dokumentarkiv | Alle | Alle (`profileProcedure`) | Ingen | ✅ |
| `/personalhandbok` | Les håndbok | Alle | Alle | Ingen | ✅ |
| `/personalhandbok/admin` | Rediger håndbok | ADMIN, HR | `hrProcedure` | Ingen | ✅ |
| `/fravaer` | Fraværsregistrering | Alle | Alle | Ingen | ✅ |
| `/fravaer/kalender` | Fraværskalender | Alle | Alle | Ingen | ✅ |
| `/lokasjoner` | Lokasjonsadmin | ADMIN, HR | `hrProcedure` | Ingen | ✅ |
| `/overtid` | Overtid/timebank | Alle | Alle | Ingen | ✅ |
| `/overtid/godkjenning` | Godkjenn overtid | ADMIN, HR, MANAGER | `profileProcedure` + rollefilter | Ingen | ✅ |
| `/varsling` | Varslingsinfo | Alle | Alle | Ingen | ✅ |
| `/varsling/ny` | Send varsel | Alle | Alle | Ingen | ✅ |
| `/varsling/mine` | Egne varsler | EMPLOYEE | Alle (filtrert til egen) | ⚠️ Ingen redirect for EMPLOYEE | ✅ |
| `/varsling/admin` | Saksbehandling | ADMIN, HR (+ tildelt MANAGER) | `isHmsRole || isManagerAssigned` | Ingen | ✅ |
| `/varsling/[id]` | Saksdetalj | Rollebasert | Server + Client RBAC | Ingen | ✅ |
| `/rapporter` | CSV-eksport | ADMIN, HR, MANAGER | Ingen eksplisitt redirect — `reportRouter` er `profileProcedure` | ⚠️ EMPLOYEE kan nå ruten men data filtreres | ✅ |
| `/varsler` | In-app varsler | Alle | Alle | Ingen | ✅ |
| `/personvern` | Personverninfo | Alle | Alle | Ingen | ✅ |
| `/admin/compliance` | P0/P1-tracker | ADMIN, HR | Redirect for andre roller | Ingen | ✅ |
| `/admin/system` | Systemstatus | ADMIN | Redirect for andre roller | Ingen | ✅ |
| `/admin/avdelinger` | Avdelingsadmin | ADMIN, HR | `hrProcedure` | Ingen | ✅ |
| `/ingen-tilgang` | Feilside | Alle | Alle | Ingen | ✅ |
| `/login` | Innlogging | Uautentisert | Uautentisert | Ingen | ✅ |

---

## Avvik og anbefalinger

### ⚠️ `/rapporter` – EMPLOYEE-redirect mangler

**Problem:** EMPLOYEE kan nå `/rapporter`-ruten direkte. Selve rapportdata filtreres server-side, men det er forvirrende UX.  
**Anbefaling:** Legg til redirect i page.tsx for EMPLOYEE → `/dashboard`.  
**Prioritet:** Lav (cosmetic)

### ⚠️ `/varsling/mine` – MANAGER redirect

**Problem:** En MANAGER uten tildelte saker som går til `/varsling/mine` vil se tom liste (korrekt), men ingen forklaring om at dette er for ansatte.  
**Anbefaling:** Vurder å legge til info-tekst eller redirect MANAGER til `/varsling/admin`.  
**Prioritet:** Lav

---

## tRPC Procedure-typer

| Procedure | Krav |
|---|---|
| `publicProcedure` | Ingen auth |
| `protectedProcedure` | Innlogget Supabase-bruker |
| `profileProcedure` | Innlogget + Profile i DB |
| `hrProcedure` | Role === HR eller ADMIN |
| `adminProcedure` | Role === ADMIN |

**Viktig:** HMS-rolle er ikke en separat Prisma-rolle. HMS-deteksjon skjer i dashboard-komponenten basert på `profile.role === "HR" && profile.title?.toLowerCase().includes("hms")`.

---

## Navigasjons-mapping

### Sidebar (desktop, lg+)

| Lenke | Roller |
|---|---|
| Dashboard | Alle |
| Avvik | Alle |
| Ansatte | ADMIN, HR |
| Lokasjoner | ADMIN, HR |
| Avdelinger | ADMIN, HR |
| Dokumenter | Alle |
| Personalhåndbok | Alle |
| Risiko | ADMIN, HR, MANAGER |
| Tiltak | Alle |
| Fravær | Alle |
| Fraværskalender | Alle |
| Overtid | Alle |
| Godkjenning overtid | ADMIN, HR, MANAGER |
| Rapporter | ADMIN, HR, MANAGER |
| Varsling | Alle |
| Varslingssaker | ADMIN, HR |
| Compliance | ADMIN, HR |
| Systemstatus | ADMIN |
| Personvern | Alle |

### BottomNav «Mer»-meny (mobil)

Tilsvarende mapping som Sidebar, filtrert per rolle.

---

*Sist oppdatert: 2026-06-14*

---

## Assistent – rollebasert rutekart

Assistenten bruker `server/assistant/routeMap.ts` for å filtrere lenkeforslag etter brukerens rolle.

| Rute | Roller |
|---|---|
| Dashboard, avvik, fravær, overtid, håndbok, dokumenter, varsling, personvern, kontrakter, opplæring, kjemikalier, risiko | Alle |
| Ansatte, rapporter, overtid godkjenning, sykefraværsoppfølging | MANAGER, HR, ADMIN |
| Kontrakter admin, onboarding-admin, compliance, varslingssaker | HR, ADMIN |
| Systemstatus, avdelinger, håndbok-admin | ADMIN |

Assistenten foreslår aldri lenker brukeren ikke har rolle til.
