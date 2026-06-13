# Pilotguide — HR/HMS PWA

Velkommen til pilottesting av HR/HMS PWA. Denne guiden hjelper deg i gang.

---

## URL og innlogging

**Staging/lokal URL:** `http://localhost:3000`

### Testbrukere

| E-post | Rolle | Passord |
|--------|-------|---------|
| admin@test.no | ADMIN | Test123! |
| hr@test.no | HR | Test123! |
| hms@test.no | HR (HMS-ansvarlig) | Test123! |
| manager@test.no | MANAGER | Test123! |
| employee1@test.no | EMPLOYEE | Test123! |
| employee2@test.no | EMPLOYEE | Test123! |

> Staging-miljøet inneholder kun fiktive testdata. Ikke legg inn ekte personopplysninger.

---

## Første test — gjør dette i rekkefølge

### 1. Logg inn

1. Åpne `http://localhost:3000` i nettleseren
2. Skriv inn e-post og passord fra tabellen over
3. Klikk **Logg inn**
4. ✅ Forventet: Du kommer til dashboardet

### 2. Sjekk dashboard

1. Se at dashboardet laster uten feil
2. Verifiser at nøkkeltall vises (avvik, tiltak, fravær)
3. ✅ Forventet: Tall og lister vises korrekt

### 3. Rapporter et avvik

1. Klikk **Avvik** i sidebaren
2. Klikk **Nytt avvik**
3. Fyll inn tittel, beskrivelse og alvorlighetsgrad
4. Klikk **Lagre**
5. ✅ Forventet: Avviket vises i listen

### 4. Les et dokument

1. Klikk **Dokumenter** i sidebaren
2. Åpne dokumentet **HMS-håndbok 2024**
3. Klikk **Bekreft lest** (hvis knappen vises)
4. ✅ Forventet: Dokumentet åpnes og lesebekreftelse registreres

### 5. Send fraværssøknad

1. Klikk **Fravær** i sidebaren
2. Klikk **Ny søknad**
3. Velg type (f.eks. Ferie), startdato og sluttdato
4. Klikk **Send søknad**
5. ✅ Forventet: Søknaden vises med status **Venter**

### 6. Test mobil og PWA-installasjon

**Android (Chrome):**
1. Åpne `http://localhost:3000` i Chrome på mobil
2. Logg inn
3. Trykk på menyikonet (⋮) → **Legg til på startskjermen**
4. Åpne appen fra hjemskjermen
5. ✅ Forventet: Appen åpner uten nettleser-krom (fullskjerm-app)

**iPhone (Safari):**
1. Åpne `http://localhost:3000` i Safari
2. Logg inn
3. Trykk **Del**-ikonet → **Legg til på Hjem-skjerm**
4. ✅ Forventet: Appen installeres og åpner som PWA

**Desktop (Chrome/Edge):**
1. Se etter installasjons-ikon (⊕) i adressefeltet
2. Klikk og bekreft installasjon
3. ✅ Forventet: Appen åpner i eget vindu

---

## Hva du bør teste videre (etter rolle)

### ADMIN

| Gjør dette | Hvor |
|-----------|------|
| Se systemstatus | Sidebaren → Systemstatus |
| Opprett og rediger en ansatt | Sidebaren → Ansatte → Ny ansatt |
| Administrer avdelinger | Sidebaren → Avdelinger |
| Se alle rapporter og eksporter CSV | Sidebaren → Rapporter |

### HR / HMS-ansvarlig

| Gjør dette | Hvor |
|-----------|------|
| Last opp et testdokument | Sidebaren → Dokumenter → Nytt dokument |
| Godkjenn en fraværssøknad | Sidebaren → Fravær |
| Se fraværskalender | Sidebaren → Fraværskalender |
| Eksporter fraværsrapport | Sidebaren → Rapporter → Fravær |

### MANAGER

| Gjør dette | Hvor |
|-----------|------|
| Se avvik i din avdeling | Sidebaren → Avvik |
| Godkjenn en fraværssøknad | Sidebaren → Fravær |
| Se fraværskalender for avdelingen | Sidebaren → Fraværskalender |

### EMPLOYEE

| Gjør dette | Hvor |
|-----------|------|
| Rapporter et avvik | Sidebaren → Avvik → Nytt avvik |
| Last opp vedlegg til avvik | Åpne avviket → Vedlegg-seksjonen |
| Les dokument og bekreft lest | Sidebaren → Dokumenter |
| Send fraværssøknad | Sidebaren → Fravær → Ny søknad |
| Aktiver push-varsler | Sidebaren → Varsler |

---

## Slik rapporterer du funn

Bruk malen i [`UAT-feedback-template.md`](UAT-feedback-template.md) og send til systemansvarlig.

**Det hjelper masse om du:**
- Beskriver steg for steg hva du gjorde
- Sier hva du forventet vs. hva som skjedde
- Legger ved et skjermbilde (Windows: Win+Shift+S, Mac: Cmd+Shift+4)

---

## Hva du ikke trenger å bekymre deg for

- **E-postvarsler** sendes ikke i staging — alt er OK selv om du ikke mottar e-post
- **Push-varsler** er i testmodus — du kan aktivere dem, men de sender console-logger, ikke faktiske push
- Du kan gjøre feil uten konsekvenser — staging-databasen kan alltid nullstilles

---

## Tidsfrist

Send tilbakemeldingene dine til **[sett inn dato]**. Spørsmål? Kontakt [sett inn kontaktperson og e-post].

Takk for at du hjelper til med å gjøre systemet bedre!
