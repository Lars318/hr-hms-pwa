# Release-sjekkliste — HR/HMS PWA

Gå gjennom listen i rekkefølge før hver produksjonsdeploy.

---

## 1. Kode — før merge til main

```
□ npx tsc --noEmit                 — ingen TypeScript-feil
□ npm run build                    — produksjonsbygg OK
□ npm run lint                     — ingen lint-feil
□ Les gjennom nye Prisma-migreringer:
    cat prisma/migrations/*/migration.sql
    → Ingen DROP av kolonner/tabeller med data
    → Ingen NOT NULL uten default på eksisterende tabell
    → Additive endringer foretrekkes alltid
□ .env.example oppdatert hvis nye variabler er lagt til
□ README oppdatert hvis ny funksjonalitet
```

---

## 2. Staging-test

```
□ Ny kode er deployet til staging (Vercel Preview)
□ prisma migrate deploy kjørt mot staging:
    DATABASE_URL="staging" npx prisma migrate deploy
□ Manuell smoke test på staging:
    □ Innlogging (alle 4 roller)
    □ Avvik — opprett, rediger
    □ Vedlegg — last opp og ned
    □ Dokumenter — last opp, les, bekreft
    □ Risiko — opprett vurdering med risikopunkt
    □ Fravær — søknad + godkjenning
    □ Fraværskalender
    □ Rapporter — eksporter CSV
    □ Varsler — in-app
    □ Admin systemside
□ Sentry staging: ingen nye uventede feil
□ Health endpoint: curl staging-url/api/health → status: ok
```

---

## 3. Godkjenning

```
□ UAT-funn gjennomgått:
    □ Ingen åpne BLOKKERENDE funn
    □ Ingen åpne KRITISKE funn (eller akseptert med begrunnelse)
□ Go/no-go-beslutning tatt (ref. docs/UAT.md)
□ Releaseansvarlig godkjent
```

---

## 4. Produksjon — klargjøring

```
□ Ta manuell pg_dump av produksjonsdatabasen (alltid ved schema-endring):
    pg_dump ... -f backup-$(date +%Y%m%d-%H%M).dump
    gpg --symmetric backup-*.dump    # krypter
    rm backup-*.dump                 # slett ukryptert

□ Lagre backup sikkert (ekstern lokasjon, passordbehandler)
□ Rollback-plan klar:
    □ Vercel: Promote siste fungerende deployment
    □ Hvis schema endret: pg_restore av backupen over
```

---

## 5. Produksjonsdeploy

```
□ Kjør Prisma-migrering mot produksjon:
    DATABASE_URL="prod" DIRECT_URL="prod-direct" npx prisma migrate deploy
    → Verifiser at ingen feil oppstod

□ Merge staging → main:
    git checkout main && git merge staging && git push origin main

□ Følg med på Vercel → Deployments:
    → Deploy status: Ready (grønn)
    → Ingen build-feil

□ Nye env-vars lagt inn i Vercel Production hvis nødvendig
```

---

## 6. Verifisering etter deploy

```
□ Health endpoint:
    curl -s https://ditt-domene.no/api/health | jq '.status'
    → "ok"

□ Sikkerhetsheaders:
    curl -I https://ditt-domene.no | grep -i "strict-transport\|x-frame\|x-content-type"
    → strict-transport-security, x-frame-options: DENY, x-content-type-options: nosniff

□ Manuell smoke test (produksjon):
    □ Logg inn med prod-bruker
    □ Opprett og se avvik
    □ Last opp og ned vedlegg
    □ Eksporter CSV-rapport
    □ In-app varsel fungerer
    □ Push-varsel (hvis aktivert)

□ Sentry produksjon:
    → Sentry → Projects → hr-hms-pwa → Filter "Last 15 min"
    → Ingen uventede exceptions

□ Vercel function logs:
    → Vercel → Deployments → siste → Functions
    → Ingen 500-feil
```

---

## 7. Etter release

```
□ Informer relevante parter om at ny versjon er i produksjon
□ Oppdater CHANGELOG eller release notes (hvis brukt)
□ Arkiver og slett backup-filer eldre enn 90 dager
□ Planlegg neste månedlige driftssjekk (ref. README — Driftssjekklister)
```

---

## Rollback-prosedyre

### Rask rollback (ingen databaseendring)

```bash
# Vercel → Deployments → finn siste fungerende → ⋯ → Promote to Production
# Tar ca. 30 sekunder
```

### Rollback med databaseendring

```bash
# 1. Decrypt og restore backup
gpg --decrypt backup-YYYYMMDD-HHMM.dump.gpg > restore.dump
pg_restore --host=... --port=5432 --username=... --dbname=postgres \
  --no-acl --no-owner --clean restore.dump

# 2. Kode-rollback via Vercel Promote

# 3. Verifiser
curl https://ditt-domene.no/api/health
```

---

*Sist oppdatert: se git-historikk*
