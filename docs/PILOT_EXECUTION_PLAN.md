# Pilotgjennomføringsplan — HR/HMS PWA

## Formål

Gjennomføre en strukturert pilotperiode på 3 uker med utvalgte brukere i et produksjonsnært staging-miljø, for å avdekke feil, måle brukertilfredshet og ta informert beslutning om Go Live.

---

## Pilotgruppe

| Rolle i virksomheten | Systemrolle | Ansvar i pilot | Kontakt |
|---------------------|-------------|----------------|---------|
| Systemansvarlig / IT | ADMIN | Teknisk oppfølging, feilrapportering, backup-verifisering | [navn og e-post] |
| HR-leder | HR | Dokumenter, fraværsgodkjenning, ansattoversikt, rapporter | [navn og e-post] |
| HMS-ansvarlig | HR | Avvik, risikovurderinger, tiltak, HMS-rapporter | [navn og e-post] |
| Avdelingsleder | MANAGER | Avvik i avdeling, fraværsgodkjenning, kalender | [navn og e-post] |
| Ansatt (kontorjobb) | EMPLOYEE | Avviksmeldinger, dokumentlesing, fraværssøknader | [navn og e-post] |
| Ansatt (felt/mobil) | EMPLOYEE | Mobil-/PWA-bruk, offline-kladd, avvik fra felt | [navn og e-post] |

### Pilotkoordinator

En person (typisk HR eller IT) er ansvarlig for:
- Daglig kontakt med pilotbrukere
- Samle og triagere tilbakemeldinger
- Eskalere P0/P1-feil til utvikler
- Oppsummere funn til post-pilot review

---

## Miljø

| Parameter | Verdi |
|-----------|-------|
| Testmiljø | Staging (se `docs/UAT.md`) |
| URL | `https://hr-hms-git-staging-din-org.vercel.app` |
| Produksjon | Ikke i bruk under pilot |
| Testdata | Fra `prisma/seed.ts` + manuelt lagt inn av pilotbrukere |
| Ingen ekte prod-data i pilot | ✅ |

---

## Uke 1 — Onboarding og grunnleggende bruk

**Mål:** Alle pilotbrukere er innlogget og kan navigere i systemet.

### Dag 1 — Kickoff (1–2 timer)

```
Ansvarlig: Pilotkoordinator + systemansvarlig

Aktiviteter:
□ Gjennomgang av PILOT_GUIDE.md med alle pilotbrukere (felles møte)
□ Alle logger inn for første gang — verifiser at innlogging fungerer
□ Vis navigasjon: dashboard, avvik, varsler, profil
□ Del UAT-feedback-template.md og forklar rapporteringsprosessen
□ Sett opp meldingskanal for feilrapportering (Slack, Teams eller e-post)
□ Avtal faste innsjekkinger (f.eks. daglig kort standup i Uke 1)
```

### Dag 2–3 — Grunnleggende funksjoner

```
Alle roller:
□ Utforsk dashboardet (verifiser at riktig data vises per rolle)
□ Naviger til alle tilgjengelige sider
□ Test innlogging fra mobil

ADMIN:
□ Legg til én testansatt via /ansatte/ny
□ Opprett én testavdeling via /admin/avdelinger
□ Gå til /admin/system — verifiser systemstatus

HR:
□ Last opp ett testdokument i /dokumenter
□ Verifiser at dokumentet vises for alle ansatte
```

### Dag 4–5 — Varsler og profil

```
Alle roller:
□ Gjennomgå varsler i /varsler
□ Klikk et varsel — verifiser navigasjon og "lest"-markering
□ Prøv å aktivere push-varsler (/varsler → Aktiver push)

Feedback-innsamling etter Uke 1:
□ Alle fyller ut ett skjema fra UAT-feedback-template.md
   (inntrykk så langt — hva er uklart, hva fungerer bra)
```

---

## Uke 2 — Daglig bruk av kjernefunksjonalitet

**Mål:** Pilotbrukerne bruker systemet til reelle (men anonymiserte) arbeidsoppgaver.

### Avvik og vedlegg

```
EMPLOYEE / HMS-ansvarlig:
□ Rapporter minst 2 reelle (anonymiserte) avvik via /avvik/ny
□ Last opp ett vedlegg (testfil) til et avvik
□ Verifiser nedlasting av vedlegg
□ Bruk offline-kladd: skru av nett → fyll inn avvik → koble til → synkroniser

MANAGER / HR:
□ Åpne innmeldte avvik i avdelingen
□ Endre status på et avvik
□ Tildel avvik til en ansatt
```

### Dokumenter og lesebekreftelser

```
HR:
□ Last opp ett nytt dokument (testfil) og sett synlighet PUBLIC
□ Krev lesing av alle ansatte

EMPLOYEE:
□ Åpne dokumentet → les → klikk "Bekreft lest"
□ Verifiser grønn hake i dokumentlisten

HR:
□ Verifiser lesestatistikk på dokumentdetalj-siden
```

### Tiltak

```
MANAGER / HR:
□ Opprett ett tiltak knyttet til et avvik
□ Tildel til en ansatt med frist om 1 uke

EMPLOYEE:
□ Se tiltak i /tiltak
□ Endre status til "Pågår"
```

### Fravær

```
EMPLOYEE:
□ Send inn én feriesøknad (testdatoer i fremtiden)

MANAGER / HR:
□ Godkjenn søknaden
□ Se søknaden i /fravaer/kalender

EMPLOYEE:
□ Motta varsel om godkjenning (in-app)
□ Prøv å godkjenne egen søknad → skal avvises
```

### Feedback-innsamling etter Uke 2

```
□ Alle fyller ut tilbakemeldingsskjema for alle scenario de har testet
□ Pilotkoordinator samler, klassifiserer og sender oversikt til utvikler
□ P0/P1-feil rettes umiddelbart
□ P2/P3 loggføres for vurdering
```

---

## Uke 3 — Avansert bruk, mobil og PWA

**Mål:** Test rapporter, push-varsler, mobilbruk og PWA-installasjon.

### Rapporter og eksport

```
MANAGER / HR / ADMIN:
□ Gå til /rapporter
□ Test alle 5 rapportfaner
□ Eksporter CSV for avvik og fravær
□ Åpne CSV i Excel — verifiser norske tegn og formatering
□ Verifiser at MANAGER kun ser avdelingsdata i CSV
```

### Push-varsler

```
Alle roller (der push er støttet):
□ Gå til /varsler → Aktiver push (godta nettleserens tillatelse)
□ Klikk "Send testvarsel" → verifiser at OS-varsel vises
□ Opprett et avvik → verifiser at HR/MANAGER mottar push-varsel
```

### Mobilbruk og PWA

```
Alle roller (på mobil):
□ Åpne staging-URL i mobilnettleser
□ Verifiser at layout er responsiv
□ Test innlogging på mobil
□ Test avviksskjema på mobil

iOS (Safari 16.4+):
□ Del → Legg til på hjemskjermen
□ Åpne installert app → verifiser standalone-modus

Android/Chrome:
□ Klikk "Installer"-knapp i nettleseren
□ Åpne installert app
□ Test offline-kladd på mobil (skru av mobildata)
```

### Sluttfeedback

```
□ Alle pilotbrukere fyller ut full tilbakemeldingsrunde
□ Samlet skjema: tilfredshet 1–5 per modul
□ Pilotkoordinator skriver utkast til POST_PILOT_REVIEW.md
□ Møte: pilotoppsummering og go/no-go-beslutning
```

---

## Måleparametere

Registrer følgende gjennom pilotperioden (manuelt eller via Prisma Studio):

| Parameter | Verdi å registrere | Kilde |
|-----------|-------------------|-------|
| Antall innlogginger | Unike sesjoner per uke | Supabase Auth Logs |
| Antall avvik opprettet | Count | `SELECT COUNT(*) FROM "Incident"` |
| Antall tiltak | Count | `SELECT COUNT(*) FROM "Action"` |
| Antall dokumentbekreftelser | Count | `SELECT COUNT(*) FROM "DocumentReadConfirmation"` |
| Antall fraværssøknader | Count | `SELECT COUNT(*) FROM "LeaveRequest"` |
| Antall rapporteksporter | Count | AuditLog WHERE action = 'REPORT_EXPORTED' |
| Antall Sentry-feil | Count per alvorlighet | Sentry → Issues |
| Feil per rolle | Antall P0/P1/P2/P3 per systemrolle | Tilbakemeldingsskjemaer |
| Push-abonnementer aktivert | Count | `SELECT COUNT(*) FROM "PushSubscription" WHERE "revokedAt" IS NULL` |

---

## Feilhåndtering under pilot

### Prioriteringsmodell

| Prioritet | Definisjon | Eksempler | Responstid |
|-----------|-----------|---------|------------|
| **P0 — Kritisk blokkerende** | System er ubrukelig, datalekkasje, RBAC-feil | Kan ikke logge inn, EMPLOYEE ser andres data, tap av avviksdata | **Innen 2 timer** — stopp pilot ved behov |
| **P1 — Viktig funksjon brutt** | Kjernefunksjon feiler, ingen workaround | Filopplasting feiler alltid, fraværssøknad kan ikke sendes, CSV eksporterer 0 rader | **Innen 24 timer** |
| **P2 — Delvis brutt** | Funksjon er delvis brutt, workaround finnes | Varsel mangler lenke, feil dato-format i rapport, en bestemt avvikstype feiler | **Innen 3 dager** |
| **P3 — Kosmetisk** | UI-feil, UX-ulempe, ingen funksjonell konsekvens | Skrivefeil, ikon passer ikke, feil farge, liten justeringssak | Loggføres for neste sprint |

### Rapporteringsprosess

1. Pilotbruker oppdager problem → fyller ut `UAT-feedback-template.md`
2. Sender til pilotkoordinator via avtalt kanal (Slack/Teams/e-post)
3. Pilotkoordinator klassifiserer prioritet
4. P0/P1 → direkte kontakt med systemansvarlig/utvikler
5. P2/P3 → loggføres i GitHub Issues (eller annet sporingsverktøy)
6. Fiks deployes til staging → pilot verifiserer fiks
7. Lukket feil registreres i POST_PILOT_REVIEW

### Eskaleringsplan

```
P0 oppdaget:
1. Pilotbruker varsler koordinator umiddelbart (telefon/melding)
2. Koordinator vurderer om pilot skal pause midlertidig
3. Systemansvarlig kontaktes uavhengig av tidspunkt
4. Fiks deployes til staging så raskt som mulig
5. Pilotbruker verifiserer fiks
6. Pilot gjenopptas
```
