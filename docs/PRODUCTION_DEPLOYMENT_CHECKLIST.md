# Production Deployment Checklist – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> Gjennomføres av IT-ansvarlig og daglig leder før pilotstart.  
> Hvert punkt merkes ✅ OK, ⚠️ Avvik (beskriv), ❌ Blokkerer.

---

## BLOKK 1 – Vercel

```
□ Vercel production-prosjekt opprettet og koblet til Git-repo (main-branch)
□ npm run build kjører rent (0 feil, 0 TypeScript-feil)
□ Node.js-versjon: 18.x (Vercel → Settings → General → Node.js Version)
□ Custom domain satt opp og aktiv
□ SSL/TLS-sertifikat provisjonert (grønn hengelås i nettleser)
□ Vercel Environment: Production (ikke Preview)
```

---

## BLOKK 2 – Supabase Production

```
□ Eget production-prosjekt opprettet (IKKE dev/staging-prosjektet)
□ Region: EU (eu-west-1 eller eu-central-1) – verifiser i prosjektinnstillinger
□ Database-skjema kjørt:
      DATABASE_URL="<prod>" npx prisma migrate deploy
      → prisma migrate status viser "Database schema is up to date!"
    Baseline-migrasjon er i git: prisma/migrations/20260615000000_baseline/
    → Kjør ALDRI --force-reset i produksjon
    → Kjør ALDRI db:seed i produksjon
    → Se docs/PRODUCTION_DATA_SETUP.md seksjon 2 for detaljer
□ Supabase Pro-plan aktivert (30-dagers backup, point-in-time restore)
□ Automatisk backup verifisert: Supabase → Database → Backups

Storage buckets (alle PRIVATE – offentlig tilgang er IKKE tillatt):
□ incident-attachments   privat  – vedlegg til avviksmeldinger
□ documents              privat  – HMS/HR-dokumenter
□ contracts              privat  – arbeidskontrakter og signeringsvedlegg

Bucket policies – verifiser at ingen bucket har public = true:
□ Supabase → Storage → [bucket] → Settings → Public: OFF

Auth konfigurert:
□ Site URL: https://ditt-domene.no (Supabase → Auth → URL Configuration)
□ Redirect URLs: https://ditt-domene.no/auth/callback
□ Email OTP / Magic Link deaktivert hvis ikke i bruk (sikkerhetsprofil)
□ Rate limits aktivert (Supabase → Auth → Settings → Rate Limits)
```

---

## BLOKK 3 – Miljøvariabler i Vercel (Production scope)

Sett alle i Vercel → Settings → Environment Variables med scope: **Production**.

### Supabase
```
□ NEXT_PUBLIC_SUPABASE_URL         (https://xxx.supabase.co)
□ NEXT_PUBLIC_SUPABASE_ANON_KEY    (anon/public key – ALDRI service_role key)
□ SUPABASE_SERVICE_ROLE_KEY        (service_role key – SERVER-ONLY)
```

### Database
```
□ DATABASE_URL    (Transaction pooler – port 6543 – for Prisma-spørringer)
□ DIRECT_URL      (Session pooler / direkte – port 5432 – for migrering)
```

### App
```
□ APP_URL         (https://ditt-domene.no – brukes i e-postlenker og CSP)
```

### E-post (Resend)
```
□ RESEND_API_KEY                (produksjons-API-nøkkel fra resend.com)
□ EMAIL_FROM                    (verifisert avsenderdomene, f.eks. HR/HMS <no-reply@dittdomene.no>)
□ EMAIL_NOTIFICATIONS_ENABLED   (true)
```

### Web Push / VAPID
```
□ VAPID_PUBLIC_KEY              (generer med: npx web-push generate-vapid-keys)
□ NEXT_PUBLIC_VAPID_PUBLIC_KEY  (SAMME verdi som VAPID_PUBLIC_KEY – er offentlig)
□ VAPID_PRIVATE_KEY             (SERVER-ONLY – aldri NEXT_PUBLIC_)
□ VAPID_SUBJECT                 (mailto:admin@dittdomene.no)
□ PUSH_NOTIFICATIONS_ENABLED    (true)
```

### Sentry
```
□ SENTRY_DSN                    (https://xxx@oyyy.ingest.sentry.io/zzz)
□ NEXT_PUBLIC_SENTRY_DSN        (SAMME verdi – trygt å eksponere)
□ SENTRY_ENVIRONMENT            (production)
□ NEXT_PUBLIC_SENTRY_ENVIRONMENT (production)
□ SENTRY_AUTH_TOKEN             (SERVER-ONLY – brukes kun ved bygg/kildekartopplasting)
□ SENTRY_ORG                    (din-sentry-org)
□ SENTRY_PROJECT                (hr-hms-pwa)
```

### Sikkerhet / feature flags
```
□ NODE_ENV settes automatisk av Vercel – IKKE sett manuelt
```

> ⚠️ E-signering er MOCK/TESTMODUS – ingen env-var for ekte BankID/Signicat.  
> Lønnsintegrasjon er ikke implementert – ingen env-var for dette.

---

## BLOKK 4 – Sentry

```
□ Sentry production-prosjekt opprettet (Next.js-prosjekttype)
□ SENTRY_DSN kopiert og satt i Vercel
□ SENTRY_ENVIRONMENT=production satt i Vercel
□ Kildekart lastes opp ved build (Sentry → Project → Source Maps)
□ Test: generer én feil i prod → dukker opp i Sentry innen 30 sek
□ Varsler konfigurert: e-post ved nye kritiske feil
```

---

## BLOKK 5 – Resend / E-post

```
□ Resend-konto verifisert
□ Avsenderdomene verifisert i Resend (DNS TXT/MX korrekt)
□ Test-e-post sendt fra Resend-dashboardet og mottatt uten spam
□ EMAIL_NOTIFICATIONS_ENABLED=true i Vercel
□ APP_URL peker på produksjons-URL (lenker i e-poster er korrekte)
```

---

## BLOKK 6 – Health check og overvåking

```
□ curl https://ditt-domene.no/api/health → HTTP 200
□ Respons inneholder: status: "ok", db.status: "ok"
□ db.latencyMs < 500 ms
□ Uptime-monitor satt opp mot /api/health (UptimeRobot / Better Stack / Pingdom)
□ Monitor varsler på e-post/SMS ved nedetid
□ Monitor sjekker hvert 5. minutt
```

---

## BLOKK 7 – Backup og rollback

```
□ Manuell pg_dump tatt av produksjonsdatabasen (dag 0 – før pilotstart)
□ Backup kryptert og lagret eksternt (ikke kun i Supabase)
□ Restore testet mot staging-miljø
□ Rollback-plan:
    Kode:    Vercel → Deployments → Promote siste stabile deployment
    Database: pg_restore av dag 0-backup mot ny Supabase-instans
□ Supabase automatisk backup aktivert og bekreftet i Supabase → Database → Backups
```

---

## BLOKK 8 – Sikkerhetssjekk

```
□ NEXT_PUBLIC_SUPABASE_ANON_KEY er IKKE service_role key (sjekk i Supabase → Settings → API)
□ SUPABASE_SERVICE_ROLE_KEY vises IKKE i Vercel Public variables
□ VAPID_PRIVATE_KEY vises IKKE i Vercel Public variables
□ RESEND_API_KEY vises IKKE i Vercel Public variables
□ DATABASE_URL vises IKKE i Vercel Public variables
□ .env og .env.local er i .gitignore (aldri committet)
□ Ingen hemmeligheter synlige i Vercel build-logger
□ HTTP-headers verifisert med curl -I https://ditt-domene.no:
    □ strict-transport-security .............. (HSTS – kun prod)
    □ x-frame-options: DENY
    □ x-content-type-options: nosniff
    □ referrer-policy: strict-origin-when-cross-origin
    □ content-security-policy: default-src 'self' ...
    □ permissions-policy: camera=(), microphone=() ...
```

---

## BLOKK 9 – Smoke test etter deployment

```
□ Innlogging fungerer med produksjonsbrukere (alle 4 roller)
□ Dashboard viser riktig rollebasert innhold
□ Avvik kan opprettes og vises
□ Vedlegg kan lastes opp og ned (signert URL)
□ In-app varsler vises og kan markeres lest
□ E-postvarsel mottas av HR-bruker
□ Push-varsler mottas på mobil
□ Admin systemside /admin/system viser grønn DB-status
□ /api/health returnerer 200 OK
□ PWA kan installeres på iOS Safari og Android Chrome
```

---

*Sist oppdatert: 2026-06-15*
