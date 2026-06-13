# Post-Pilot Review — HR/HMS PWA

**Versjon:** [X.Y]  
**Pilotperiode:** [dato fra] – [dato til]  
**Gjennomført av:** [pilotkoordinator]  
**Dato for review:** [dato]  
**Status:** Utkast / Klar for beslutning / Godkjent

---

## 1. Sammendrag

*Kort oppsummering (5–10 setninger): hva ble testet, hva fungerte, hva fungerte ikke, anbefalt beslutning.*

---

## 2. Pilotdeltakere

| Rolle | Antall | Gjennomførte alle scenarier? | Kommentar |
|-------|--------|---------------------------|-----------|
| ADMIN | 1 | Ja / Nei | |
| HR | 1 | Ja / Nei | |
| HMS-ansvarlig | 1 | Ja / Nei | |
| MANAGER | 1 | Ja / Nei | |
| EMPLOYEE | 2 | Ja / Nei | |

**Deltakelsesrate:** [X av 6 pilotbrukere fullførte alle scenarier]

---

## 3. Mål og resultater

| Måleparameter | Mål | Faktisk | Kommentar |
|--------------|-----|---------|-----------|
| Antall innlogginger | ≥ 20 | | |
| Antall avvik opprettet | ≥ 5 | | |
| Antall tiltak opprettet | ≥ 3 | | |
| Antall dokumentbekreftelser | ≥ 4 | | |
| Antall fraværssøknader | ≥ 3 | | |
| Antall CSV-eksporter | ≥ 2 | | |
| Antall push-aktiverte enheter | ≥ 3 | | |
| Antall P0/P1-feil | 0 | | |

---

## 4. Funksjonelle funn

### 4.1 Hva fungerte godt

*List opp moduler/funksjoner som fungerte uten problem og fikk positiv tilbakemelding.*

- 
- 
- 

### 4.2 Hva fungerte ikke / feil funnet

Fyll inn ett felt per funn:

| ID | Prioritet | Modul | Beskrivelse | Status |
|----|-----------|-------|-------------|--------|
| F-01 | P0/P1/P2/P3 | | | Åpen / Lukket / Akseptert |
| F-02 | | | | |
| F-03 | | | | |

**Antall P0:** ___  
**Antall P1:** ___  
**Antall P2:** ___  
**Antall P3:** ___  
**Forbedringsforslag:** ___

---

## 5. Brukeropplevelse

### 5.1 Tilfredshet per modul (1–5, snitt)

| Modul | Snitt score | Kommentarer |
|-------|------------|-------------|
| Innlogging og navigasjon | | |
| Avvik og vedlegg | | |
| Dokumenter og lesebekreftelse | | |
| Risikovurderinger og tiltak | | |
| Fraværssøknader og kalender | | |
| Rapporter og CSV | | |
| Varsler (in-app, e-post, push) | | |
| Mobilbruk og PWA | | |
| Offline-funksjonalitet | | |

**Total gjennomsnittlig tilfredshet:** ___/5

### 5.2 Åpne brukerkommentarer

*Oppsummer de viktigste kommentarene fra tilbakemeldingsskjemaene.*

- 
- 
- 

### 5.3 Største brukbarhetsutfordringer

*Hva tok lengst tid å forstå? Hva var forvirrende?*

- 
- 

---

## 6. Tekniske observasjoner

### 6.1 Ytelse

*Var lastetider akseptable? Notenble trege endepunkter?*

| Endepunkt / side | Observert responstid | Vurdering |
|-----------------|---------------------|-----------|
| /dashboard | | OK / Tregere enn ønsket |
| /rapporter (CSV) | | |
| Filopplasting | | |

### 6.2 Sentry-funn

*Kopier inn relevante feil fra Sentry → Issues fra pilotperioden.*

| Feil | Frekvens | Alvorlighet | Status |
|------|----------|------------|--------|
| | | | |

### 6.3 Supabase/Vercel logger

*Noterbare feil eller mønstre i loggene?*

- 

### 6.4 Sikkerhetsobservasjoner

*Ble det oppdaget noe uventet i RBAC eller tilgangsstyring?*

- [ ] Ingen RBAC-avvik observert
- [ ] EMPLOYEE fikk tilgang til data de ikke skulle ha: [beskriv]
- [ ] Annet: [beskriv]

---

## 7. Infrastruktur og drift

```
□ Backup fungerte som planlagt: Ja / Nei
□ Health endpoint var oppe hele piloten: Ja / Nei
□ Sentry varslet korrekt om feil: Ja / Nei
□ E-postvarsler fungerte: Ja / Nei
□ Push-varsler fungerte: Ja / Nei
□ Ingen nedetid under pilot: Ja / Nei

Eventuelle driftshendelser:
[beskriv her]
```

---

## 8. Åpne feil og planlagte tiltak

Liste over funn som ikke er lukket ved tidspunktet for review:

| ID | Prioritet | Beskrivelse | Ansvarlig | Planlagt ferdig |
|----|-----------|-------------|-----------|-----------------|
| | | | | |

---

## 9. Teknisk gjeld — prioriteringsliste

### Høy prioritet (bør fikses før eller kort tid etter Go Live)

| Tiltak | Begrunnelse |
|--------|-------------|
| Supabase RLS fase 1 aktivert i produksjon | Blokkerer direkte anon-tilgang til tabelldata (`docs/RLS_PLAN.md`) |
| Redis rate limiting (Upstash) | In-memory limiter nullstilles ved Vercel cold starts — ikke pålitelig i multi-instance |
| Nonce-basert CSP | Fjerne `'unsafe-inline'` fra `script-src` for sterkere XSS-beskyttelse |

### Middels prioritet (innen 1–3 måneder)

| Tiltak | Begrunnelse |
|--------|-------------|
| Sentry Session Replay konfigurering og testing | Verifiser at PII ikke lekker i replay-data |
| Uptime-monitor konfigurert (UptimeRobot/Better Stack) | Varsling ved nedetid |
| Ekte PWA-ikoner | Erstatte placeholder-ikoner med bedriftsgrafikk |
| Automatisert månedlig restore-test | Verifisere at backup er brukbar |

### Lav prioritet / backlog (fremtidige steg)

| Tiltak | Begrunnelse |
|--------|-------------|
| Timeføring | Ny modul — ikke i gjeldende scope |
| Avanserte HMS-rapporter (PDF, diagrammer) | Ønsket av HMS-ansvarlig |
| Integrasjon mot lønnssystem | Fremtidig steg |
| Supabase RLS fase 2–3 | Full RLS-dekning |
| Per-varseltype push-preferanser | Brukere ønsker mer kontroll over hvilke push de mottar |
| Daglig varselsdigest via e-post | Redusere antall enkelt-varsler |

---

## 10. Beslutning

### Go/no-go-kriterier

| Kriterium | Status |
|-----------|--------|
| Ingen åpne P0-feil | ✅ / ❌ |
| Ingen åpne P1-feil | ✅ / ❌ |
| Ingen RBAC-feil oppdaget | ✅ / ❌ |
| Filopplasting og nedlasting fungerer | ✅ / ❌ |
| Fraværsgodkjenning fungerer for alle roller | ✅ / ❌ |
| CSV-eksport produserer korrekte filer | ✅ / ❌ |
| Staging smoke test bestått | ✅ / ❌ |
| Minst 4 av 6 piloter fullførte | ✅ / ❌ |
| Backup og restore er testet | ✅ / ❌ |

### Anbefalt beslutning

- [ ] **Go Live** — alle kriterier er oppfylt, ingen blokkerende feil
- [ ] **Go Live med kjente avvik** — angitte P2/P3-feil er akseptert og loggført
- [ ] **Ny pilot** — [begrunnelse]
- [ ] **Pause prosjekt** — [begrunnelse]

### Beslutning tatt av

| Rolle | Navn | Dato | Signatur |
|-------|------|------|---------|
| Prosjektansvarlig | | | |
| Systemansvarlig | | | |
| HR-leder | | | |

---

## 11. Neste steg etter Go Live

```
□ Sett opp Go Live Checklist (docs/GO_LIVE_CHECKLIST.md)
□ Aktiver RLS fase 1 i produksjon (docs/RLS_PLAN.md)
□ Konfigurer uptime-monitor mot /api/health
□ Ta pg_dump dag 0
□ Send velkomst til alle brukere
□ Planlegg månedlig driftssjekk (første dato: [dato])
□ Book retrospektiv med pilotgruppen 30 dager etter Go Live
```
