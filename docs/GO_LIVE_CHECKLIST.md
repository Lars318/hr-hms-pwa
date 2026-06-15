# Go Live Checklist — HR/HMS PWA

Denne sjekklisten gjennomføres i rekkefølge av systemansvarlig og evt. pilotkoordinator.  
Hvert punkt merkes med ✅ OK, ⚠️ Avvik (beskriv), eller ❌ Blokkerer.

Ingen punkt merket ❌ skal finnes når Go Live vedtas.

---

## BLOKK A — Infrastruktur

### A1 — Vercel

```
□ Vercel production deployment er klar (grønn status)
□ Build kjørte uten feil (npm run build)
□ Node-versjon er 18.x (Vercel → Settings → General → Node.js Version)
□ Riktig Git-branch er koblet til production (main)
□ Custom domain er satt opp og aktiv
□ SSL-sertifikat er provisjonert (HTTPS grønn hengelås i nettleser)
□ vercel.json er committet i repo
```

### A2 — Supabase production

```
□ Eget produksjonsprosjekt opprettes (ikke staging-prosjektet)
□ Prisma migrate deploy er kjørt mot produksjonsdatabasen:
    DATABASE_URL="prod" DIRECT_URL="prod-direct" npx prisma migrate deploy
□ migrate status viser: "All migrations have been applied"
□ Storage buckets er opprettet:
    □ incident-attachments — privat ✅
    □ documents — privat ✅
□ Bucket policies: ingen public access
□ Auth → URL Configuration:
    □ Site URL: https://ditt-domene.no
    □ Redirect URLs: https://ditt-domene.no/auth/callback
□ Supabase Pro-plan aktivert (30 dagers backup, point-in-time restore)
□ Automatisk backup verifisert i Supabase → Database → Backups
```

### A3 — Miljøvariabler i Vercel (production scope)

```
□ NEXT_PUBLIC_SUPABASE_URL        (produksjon Supabase URL)
□ NEXT_PUBLIC_SUPABASE_ANON_KEY   (produksjon anon key)
□ SUPABASE_SERVICE_ROLE_KEY       (produksjon service role — server-only)
□ DATABASE_URL                    (transaction pooler port 6543)
□ DIRECT_URL                      (session pooler port 5432)
□ APP_URL                         (https://ditt-domene.no)
□ RESEND_API_KEY                  (produksjons-API-nøkkel)
□ EMAIL_FROM                      (verifisert avsenderdomene)
□ EMAIL_NOTIFICATIONS_ENABLED     (true)
□ VAPID_PUBLIC_KEY
□ NEXT_PUBLIC_VAPID_PUBLIC_KEY    (samme verdi som VAPID_PUBLIC_KEY)
□ VAPID_PRIVATE_KEY               (server-only)
□ VAPID_SUBJECT                   (mailto:admin@dittdomene.no)
□ PUSH_NOTIFICATIONS_ENABLED      (true)
□ SENTRY_DSN
□ NEXT_PUBLIC_SENTRY_DSN          (samme verdi som SENTRY_DSN)
□ SENTRY_ENVIRONMENT              (production)
□ NEXT_PUBLIC_SENTRY_ENVIRONMENT  (production)
□ SENTRY_AUTH_TOKEN
□ SENTRY_ORG
□ SENTRY_PROJECT
□ NODE_ENV settes automatisk av Vercel — ikke sett manuelt
```

---

## BLOKK B — E-post og Push

### B1 — Resend

```
□ Resend-konto er opprettet og verifisert
□ Avsenderdomene er verifisert i Resend (DNS TXT/MX-records er satt)
□ Test-e-post sendt fra Resend-dashboardet → mottatt uten spam
□ EMAIL_NOTIFICATIONS_ENABLED=true i Vercel production
□ APP_URL i env peker på produksjons-URL (brukes i e-postlenker)
```

### B2 — Web Push / VAPID

```
□ VAPID-nøkler generert med npx web-push generate-vapid-keys
□ Nøkler lagret i passordbehandler (ikke bare i Vercel)
□ PUSH_NOTIFICATIONS_ENABLED=true i Vercel production
□ Test: logg inn → /varsler → Aktiver push → Send testvarsel → OS-varsel mottatt
```

---

## BLOKK C — Sikkerhet

### C1 — HTTP-headers

```
□ curl -I https://ditt-domene.no output inneholder:
    □ strict-transport-security: max-age=31536000; includeSubDomains
    □ x-frame-options: DENY
    □ x-content-type-options: nosniff
    □ referrer-policy: strict-origin-when-cross-origin
    □ permissions-policy: camera=(), microphone=(), ...
    □ content-security-policy: default-src 'self'; ...
```

### C2 — Hemmeligheter

```
□ Ingen hemmeligheter eksponert i nettleserkode:
    □ SUPABASE_SERVICE_ROLE_KEY er IKKE i NEXT_PUBLIC_-variabler
    □ VAPID_PRIVATE_KEY er IKKE i NEXT_PUBLIC_-variabler
    □ RESEND_API_KEY er IKKE i NEXT_PUBLIC_-variabler
    □ DATABASE_URL er IKKE i NEXT_PUBLIC_-variabler
□ .env.local er i .gitignore — aldri committet
□ Ingen hemmeligheter synlige i Vercel build-logger
```

### C3 — Auth

```
□ Supabase Auth rate limits er aktivert (Auth → Settings → Rate Limits)
□ Supabase → Auth → Users: kun autoriserte brukere finnes
□ Test: ugyldig passord → feilmelding vises, ikke systeminformasjon
□ Test: uautentisert tilgang til /dashboard → redirect til /login
□ Test: EMPLOYEE forsøker /rapporter → redirect til /ingen-tilgang
```

### C4 — Storage

```
□ incident-attachments bucket er privat
□ documents bucket er privat
□ contracts bucket er privat (kontrakter og e-signeringsvedlegg)
□ Direkte URL til fil (uten signert token) returnerer 400/403
□ Signert nedlastings-URL fungerer: åpner fil i ny fane
□ Signert URL utløper (kontrakter: 300 sek, vedlegg: 60 sek)
□ Testmerknad: e-signering er mock — ingen BankID eller ekte signatur
```

---

## BLOKK D — Observabilitet og drift

### D1 — Sentry

```
□ Sentry-prosjekt er opprettet og konfigurert for Next.js
□ SENTRY_DSN og NEXT_PUBLIC_SENTRY_DSN er satt i Vercel
□ SENTRY_ENVIRONMENT=production
□ Kildekart er lastet opp (Sentry → Project → Source Maps)
□ Test: generer én testfeil → dukker opp i Sentry innen 30 sek
□ Sentry-varsling er konfigurert (e-post/Slack ved nye feil)
```

### D2 — Health endpoint

```
□ curl https://ditt-domene.no/api/health → HTTP 200
□ Response inneholder: status: "ok", db.status: "ok"
□ db.latencyMs er < 500 ms
```

### D3 — Uptime-monitor

```
□ UptimeRobot / Better Stack / Pingdom satt opp mot /api/health
□ Varslingskanal konfigurert (e-post / Slack ved nedetid)
□ Monitor tester hvert 5. minutt (eller hyppigere)
```

### D4 — Backup

```
□ Manuell pg_dump tatt av produksjonsdatabasen (dag 0)
□ Backup kryptert og lagret sikkert (ekstern lokasjon)
□ Restore er testet mot staging (verifisert at data er intakt)
□ Backup-rutine er satt opp (ukentlig manuell, daglig Supabase auto)
□ Supabase → Database → Backups viser siste backup
```

---

## BLOKK E — Applikasjonstest (smoke test på prod)

```
□ Innlogging fungerer for alle 4 roller (test med faktiske produksjonsbrukere)
□ Dashboard viser riktig rollebasert data
□ Avvik — opprett og se
□ Vedlegg — last opp og ned
□ Dokumenter — last opp, les, bekreft
□ Risiko — opprett risikovurdering
□ Fravær — søknad og godkjenning
□ Fraværskalender — vis måneds- og årsvisning
□ Rapporter — CSV-eksport fungerer
□ In-app varsler — vises, klikkes, markeres lest
□ E-postvarsler — mottas av HR-bruker ved nytt avvik
□ Push-varsler — aktiver og motta testvarsel
□ Admin systemside (/admin/system) viser grønn DB-status
□ PWA: installer app i Chrome → åpner i standalone-modus
□ Offline: kladd lagres og synkroniseres
```

---

## BLOKK F — Brukere og onboarding

```
□ ADMIN-bruker opprettet i Supabase Auth + Profile
□ HR-bruker(e) opprettet
□ HMS-ansvarlig opprettet (HR-rolle)
□ Avdelingsleder(e) opprettet med MANAGER-rolle og riktig avdeling
□ Ansatte opprettet (EMPLOYEE) og knyttet til avdeling
□ Avdelinger opprettet og navngitt korrekt
□ Velkomst-e-post sendt til alle brukere med:
    □ Innloggings-URL
    □ Passord (sett til midlertidig, bruker endrer selv)
    □ Begrunnelse for systemet
    □ Hvem de kontakter ved problemer
□ Pilotguide (docs/PILOT_GUIDE.md) delt med alle brukere
```

---

## BLOKK G — Go/no-go-beslutning

```
□ Alle BLOKK A–F er fullført uten ❌
□ Ingen åpne P0 eller P1 fra piloten
□ Pilotoppsummering (POST_PILOT_REVIEW.md) er signert av ansvarlig
□ Rollback-plan er klar og forstått av systemansvarlig:
    Kode: Vercel → Promote siste deployment
    DB: pg_restore av dag 0-backup
□ Go Live vedtatt av [ansvarlig person/leder]
□ Lanseringstidspunkt bekreftet: [dato og klokkeslett]
```

---

## BLOKK H — Etter Go Live (dag 1)

```
□ Sentry → sjekk Issues 1 time etter lansering
□ Vercel → sjekk Function logs for 500-feil
□ Supabase → sjekk Database og Auth logs
□ Pilotkoordinator tilgjengelig for brukerspørsmål
□ Uptime-monitor grønn
□ health endpoint: status OK
□ Ta ny pg_dump (dag 1 etter lansering)
```
