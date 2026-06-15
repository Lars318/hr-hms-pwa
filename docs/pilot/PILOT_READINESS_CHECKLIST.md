# Pilot Readiness Checklist – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> **Formål:** Systematisk gjennomgang av alle krav før pilotstart.  
> **Ansvarlig:** Daglig leder + IT-ansvarlig + HR-leder

---

## Seksjon 1 – Teknisk

### Bygg og distribusjon
- [ ] `npm run build` kjører uten feil ← Verifisert 2026-06-15 (grønn)
- [ ] `npm run typecheck` gir 0 feil ← Verifisert 2026-06-15 (grønn)
- [ ] Produksjonsbygg distribuert til Vercel (eller annen prod-hosting)
- [ ] Miljøvariabler satt i prod (ikke dev-verdier) – se `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- [ ] Supabase prod-prosjekt satt opp (ikke dev-prosjekt)
- [ ] `npx prisma migrate deploy` kjørt mot prod-database (IKKE db:push, IKKE --force-reset)
- [ ] `npx prisma migrate status` viser «All migrations applied»
- [ ] Seed-script ALDRI kjørt mot prod – se `docs/PRODUCTION_DATA_SETUP.md`

### Sikkerhet og infrastruktur
- [ ] HTTPS aktivert og validert
- [ ] CSP-headers verifisert i prod
- [ ] HSTS aktivert i prod
- [ ] Supabase RLS vurdert (appen bruker Prisma/servicebruker – dokumentert i PROJECT_STATUS.md)
- [ ] Storage buckets satt til privat: incident-attachments, documents, contracts – se `docs/STORAGE_BUCKETS.md`
- [ ] Signed URLs brukes for alle filnedlastinger (verifisert server-side)
- [ ] Rate-limiting verifisert på upload-endepunkter (attachment, document, contract) ← Implementert
- [ ] Dashboard error boundary finnes (`app/(dashboard)/error.tsx`) ← Implementert
- [ ] Global error boundary finnes (`app/error.tsx` med Sentry) ← Implementert

### Overvåking
- [ ] Sentry feillogging aktivert og validert
- [ ] Varsler konfigurert for kritiske feil i Sentry
- [ ] Vercel/hosting-overvåking satt opp

### PWA
- [ ] Service Worker fungerer
- [ ] App kan installeres på mobil (iOS Safari / Android Chrome)
- [ ] Offline-side (/offline) vises ved manglende nett
- [ ] Push-varsler testet (iOS + Android)

---

## Seksjon 2 – Personvern og compliance

### Dokumentasjon
- [ ] `docs/pilot/DPA_CHECKLIST.md` gjennomgått
- [ ] `docs/pilot/PROCESSING_BASIS_REGISTER.md` gjennomgått av daglig leder
- [ ] `docs/pilot/RETENTION_POLICY_DRAFT.md` godkjent av daglig leder
- [ ] `docs/pilot/PERSONAL_DATA_BREACH_PROCEDURE.md` gjennomgått av IT + daglig leder
- [ ] `docs/pilot/DATA_SUBJECT_REQUEST_PROCEDURE.md` gjennomgått av HR

### Databehandleravtaler
- [ ] DPA inngått med **Supabase**
- [ ] DPA inngått med **Vercel**
- [ ] DPA inngått med **Resend**
- [ ] DPA inngått med **Sentry**
- [ ] Signerte DPA-er arkivert internt

### Dataregion
- [ ] Supabase: bekreftet EU-region
- [ ] Vercel: bekreftet EU-region for serverside
- [ ] Resend: bekreftet dataregion
- [ ] Sentry: bekreftet EU-region

### Personvernside
- [ ] /personvern tilgjengelig og gjennomgått av HR
- [ ] Kontaktpunkt for innsyn/retting er korrekt (hr@pulsfollo.no)

### Behandlingsgrunnlag
- [ ] Behandlingsgrunnlag bekreftet av juridisk rådgiver (eller godtatt risiko dokumentert)

---

## Seksjon 3 – HMS

### Rutiner og dokumenter
- [ ] Verneombud definert per lokasjon i appen (Ski + Vestby)
- [ ] HMS-ansvarlig definert per lokasjon
- [ ] Personalhåndbok publisert (eller tydelig at den er under utarbeiding)
- [ ] HMS-prosedyrer tilgjengelig som dokumenter i appen
- [ ] Avviksmodul testet av minst én ansatt per lokasjon

### Avgrensninger kommunisert
- [ ] Ansatte informert om at appen ikke er full arbeidstidsregistrering
- [ ] AMU-avgrensning kommunisert
- [ ] BHT-avgrensning kommunisert

---

## Seksjon 4 – Roller og tilgang

### Brukerkontoer
- [ ] Alle ansatte har Supabase-konto opprettet
- [ ] Alle ansatte har Profile-oppføring i databasen
- [ ] Roller tildelt korrekt (ADMIN, HR, MANAGER, EMPLOYEE)
- [ ] Lokasjonestilknytning (ProfileAssignment) satt for alle ansatte
- [ ] Primærlokasjon satt for ansatte med flere lokasjoner

### Tilgangstesting
- [ ] EMPLOYEE-rolle: kun egne data, ingen admin-sider
- [ ] MANAGER-rolle: egne ansatte + godkjenning
- [ ] HR-rolle: full tilgang, ikke systemadmin
- [ ] ADMIN-rolle: full tilgang inkl. systemstatus

---

## Seksjon 5 – Testbrukere og data

- [ ] Testbrukere fjernet fra prod (eller tydelig markert som test)
- [ ] Seed-data fjernet (avvik, risikovurderinger, dokumenter)
- [ ] Testnotifikasjoner slettet
- [ ] Audit-logg ryddet for testdata
- [ ] Verifisert at ingen testdata er synlig for reelle ansatte

---

## Seksjon 6 – Drift og support

### Backup og disaster recovery
- [ ] Supabase automatisk backup aktivert (kontroller i prosjektinnstillinger)
- [ ] Plan for gjenoppretting ved databasefeil dokumentert
- [ ] Kontakt til Supabase support notert

### Support-rutiner
- [ ] IT-kontaktpunkt for tekniske feil definert: [Navn / e-post / telefon]
- [ ] HR-kontaktpunkt for brukerspørsmål definert
- [ ] Rutine for tilbakestilling av passord (via Supabase Auth)
- [ ] Rutine for ny brukeropprettelse

### Vedlikehold
- [ ] Plan for oppdateringer under pilot (hvem, hvordan, varslingstid)
- [ ] Nedetids-kommunikasjonsplan til ansatte

---

## Seksjon 7 – Support og opplæring

### Brukerdokumentasjon
- [ ] Kort intro-guide til appen for ansatte (PDF/e-post)
- [ ] Guide for å melde avvik (viktigste funksjon for ansatte)
- [ ] Guide for fravær og overtid

### Opplæring
- [ ] ADMIN/HR opplært i å administrere brukere og lokasjoner
- [ ] MANAGER opplært i å godkjenne fravær og overtid
- [ ] EMPLOYEE informert om hva appen brukes til

---

## Seksjon 8 – Go/No-Go

### Absolutte krav (blokkerer pilot)
- [ ] 0 TypeScript-feil i build
- [ ] Alle P0-krav i COMPLIANCE_BACKLOG.md håndtert
- [ ] DPA inngått med alle leverandører
- [ ] Alle ansatte har tilgang til appen
- [ ] Avviksmodul fungerer end-to-end
- [ ] Fraværsmodul fungerer end-to-end

### Akseptable mangler ved pilotstart

- Ekstern anonym varslingskanal – ikke implementert (intern varslingsmodul er tilgjengelig)
- Automatisk deaktivering av profil ved oppsigelse – manuell prosess
- Lønnsintegrasjon – eget system, ikke i scope
- E-signering er mock/testmodus – ingen BankID eller ekte juridisk signatur (tydelig merket i UI)
- Teams og externe samhandlingsintegrasjoner – ikke i scope

---

**Go-beslutning:**

- Dato: ___________
- Signert av daglig leder: ___________
- Signert av IT-ansvarlig: ___________
- Signert av HR-leder: ___________

---

*Sist oppdatert: 2026-06-15*
