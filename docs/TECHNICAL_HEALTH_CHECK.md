# Teknisk helsesjekk – HR/HMS PWA

> **Dato:** 2026-06-14  
> **Etter:** Steg 25A

---

## Kommandoer kjørt

### 1. `npx prisma generate`

```
✓ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in ~120ms
```

**Resultat:** OK

---

### 2. `npx tsc --noEmit`

```
(ingen output)
```

**Resultat:** ✅ 0 TypeScript-feil

---

### 3. `npm run build` (inkluderer `prisma generate && next build`)

```
✓ Compiled successfully
✓ Generating static pages (39/39)
```

**Resultat:** ✅ Rent bygg

---

## TypeScript-feilhistorikk

### Løste feil (fra Steg 24A/24B/24C/25A)

Alle tidligere TypeScript-feil er løst. Ingen kjente gjenværende feil.

Tidligere fikset kategorier:
- `LeaveCalendar` / `LeaveYearOverview` — manglende valgfrie felter i interface
- `leaveRequest.ts` — `status` og `type` cast til `any`
- `dashboard.ts` — eksplisitt import av `ActionStatus`
- `document.ts` — `Array.from()` i stedet for spread på `Set`
- `rateLimit.ts` — `Array.from(store)` i stedet for direkte iterasjon
- `card.tsx` — manglende Card-komponenter opprettet
- `lib/supabase/server.ts` — eksplisitt type på `cookiesToSet`
- `PushNotificationSettings.tsx` — `as unknown as BufferSource`
- `next.config.mjs` — fjernet `fallbacks` (next-pwa@5.6.0 bug)

---

## Kjente tekniske avgrensninger

| Område | Beskrivelse | Prioritet |
|---|---|---|
| PWA fallbacks | `fallbacks: { document: "/offline" }` fjernet pga. next-pwa@5.6.0 + Next.js 14 bug | Medium |
| Prisma BYPASSRLS | Prisma bruker postgres superuser — `auth.uid()` returnerer NULL i Prisma-kontekst | Dokumentert design |
| RLS | Supabase Row Level Security ikke aktivert — valgt arkitektur er server-side RBAC i tRPC | Dokumentert design |
| Offline sync | Ingen offline data-synkronisering — kun lesing av cachet innhold via Service Worker | Lav (for pilot) |
| Anonymous whistleblowing | Kun delvis anonymitet — admin kan teknisk finne logger | Kommunisert i UI |

---

## Sikkerhetstilstand

| Sjekk | Status |
|---|---|
| `.env` / `.env.local` i `.gitignore` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` er ikke service_role key | ✅ (kontroller ved produksjonssetting) |
| `SUPABASE_SERVICE_ROLE_KEY` er ikke i NEXT_PUBLIC_ | ✅ |
| Storage bucket privat | ✅ (private = true) |
| Signerte URLer for nedlasting | ✅ |
| Rate limiting på upload | ✅ (`lib/security/rateLimit.ts`) |
| RBAC server-side i tRPC procedures | ✅ |
| Sentry feillogging | ✅ |

---

## Avhengigheter av interesse

```
next: 14.2.4
prisma: 5.22.0
@prisma/client: 5.22.0
@trpc/server: 11.x
@supabase/ssr: latest
next-pwa: 5.6.0  ← kjent bug med fallbacks i Next.js 14
superjson: 2.x
zod: 3.x
```

---

## Anbefalt neste tekniske helsesjekk

Gjennomfør ved neste steg:
- `npx tsc --noEmit` etter schema-endringer
- `npm run build` etter nye moduler
- Sjekk signerte URL-utløp (standard 60 sekunder — vurder om det er nok)
- Verifiser Sentry DSN er konfigurert i produksjon

---

*Sist oppdatert: 2026-06-14*
