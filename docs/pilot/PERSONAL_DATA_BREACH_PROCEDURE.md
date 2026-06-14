# Rutine for håndtering av personvernbrudd

> **Versjon:** 1.0 – Juni 2026  
> **Hjemmel:** GDPR art. 33 (varsling til Datatilsynet) og art. 34 (varsling til berørte).  
> **Viktig:** Datatilsynet skal varsles innen **72 timer** etter at bruddet er oppdaget, dersom det medfører risiko for den registrertes rettigheter.  
> **Merk:** Denne rutinen er et operativt utkast – gjennomgås og godkjennes av daglig leder.

---

## Hva er et personvernbrudd?

Et personvernbrudd foreligger når sikkerhet ved behandling av personopplysninger brytes, slik at opplysningene:
- utilsiktet eller ulovlig **tilintetgjøres**,
- **går tapt** eller **endres**, eller
- **utleveres** eller **gjøres tilgjengelig** for uvedkommende.

Eksempler i kontekst av HR/HMS-portalen:
- Uautorisert tilgang til databasen (Supabase-lekkasje)
- Ansattdata sendt til feil mottaker per e-post
- Tap av passord / kompromittert konto
- Feilkonfigurering som gjør data synlig for uvedkommende
- Ransomware eller datatap

---

## Prosess – steg for steg

### Steg 1 – Oppdagelse

**Hvem kan oppdage et brudd:**
- Teknisk team (varsler fra Sentry, Supabase, Vercel)
- Ansatt som oppdager uventet tilgang
- Ekstern part som varsler

**Umiddelbar handling:**
- [ ] Dokumenter tidspunkt for oppdagelse
- [ ] Vurder om systemet må settes ned eller isoleres
- [ ] **Ikke** forsøk å dekke over eller utsette varsling

---

### Steg 2 – Intern varsling

Varsle umiddelbart (innen 1 time):

| Rolle | Person | Kontakt |
|---|---|---|
| Daglig leder | [Navn] | [E-post / telefon] |
| IT-ansvarlig | [Navn] | [E-post / telefon] |
| HMS-ansvarlig | [Navn] | [E-post / telefon] |

> Erstatt placeholders med faktiske kontaktpersoner før pilot.

---

### Steg 3 – Sikring og begrensning

- [ ] Begrens ytterligere eksponering (endre tilganger, passord, steng API-nøkler)
- [ ] Sikre logger og bevis – ikke slett noe
- [ ] Kontakt Supabase/Vercel/Sentry ved behov for hjelp til isolering
- [ ] Loggfør alle tiltak med tidspunkt og ansvarlig

---

### Steg 4 – Vurdering av risiko

Svar på følgende:

| Spørsmål | Svar |
|---|---|
| Hvilke data er berørt? | |
| Hvor mange personer er berørt? | |
| Hva er sannsynlig konsekvens for de berørte? | |
| Er det særlige kategorier (helse, økonomi)? | |
| Er bruddet pågående eller stoppet? | |
| Er data kryptert? | |

**Risikonivå:**
- **Lav risiko:** Ikke nødvendig å varsle Datatilsynet (men dokumenter uansett)
- **Risiko for de registrerte:** Varsle Datatilsynet innen 72 timer
- **Høy risiko for de registrerte:** Varsle Datatilsynet OG berørte personer

---

### Steg 5 – Vurdering av varsling til Datatilsynet (innen 72 timer)

Datatilsynet skal varsles dersom bruddet med **sannsynlighet medfører risiko** for fysiske personers rettigheter og friheter.

**Kontakt Datatilsynet:**
- Nettskjema: [www.datatilsynet.no/om-datatilsynet/kontakt-oss/meld-avvik/](https://www.datatilsynet.no/om-datatilsynet/kontakt-oss/meld-avvik/)
- Telefon: 74 06 04 50

**Informasjon som skal oppgis:**
- [ ] Beskrivelse av bruddet (art og omfang)
- [ ] Antall berørte personer
- [ ] Kontaktperson hos behandlingsansvarlig
- [ ] Sannsynlige konsekvenser
- [ ] Tiltak som er eller vil bli iverksatt
- [ ] Dersom varsling er forsinket: begrunnelse

> Tidspunkt for varsling: \_\_\_\_\_\_\_\_\_\_  
> Referansenummer hos Datatilsynet: \_\_\_\_\_\_\_\_\_\_

---

### Steg 6 – Vurdering av varsling til berørte personer (art. 34)

Berørte skal varsles **uten unødig opphold** dersom bruddet med **sannsynlighet medfører høy risiko**.

**Varsel til berørte skal inneholde:**
- Klar beskrivelse av hva som har skjedd
- Kontaktopplysninger til behandlingsansvarlig
- Mulige konsekvenser
- Tiltak som er iverksatt

**Unntak:** Varsling til berørte kan unnlates dersom:
- Data var kryptert / uleselig
- Tiltak er iverksatt slik at risiko er eliminert
- Varsling vil kreve uforholdsmessig innsats (da: offentlig kunngjøring)

---

### Steg 7 – Dokumentasjon (alltid, uavhengig av risikonivå)

Dokumenter i en hendelseslogg:

- [ ] Tidspunkt for oppdagelse
- [ ] Beskrivelse av bruddet
- [ ] Berørte data og personer
- [ ] Risikovurdering
- [ ] Tiltak iverksatt
- [ ] Varsling til Datatilsynet (ja/nei, tidspunkt, referanse)
- [ ] Varsling til berørte (ja/nei, tidspunkt, metode)
- [ ] Hvem var involvert i håndteringen

**Oppbevaringssted for dokumentasjon:** [Legg inn intern filserver/lenke]

---

### Steg 8 – Etterarbeid

Etter at hendelsen er håndtert:

- [ ] Gjennomgå hva som gikk galt (root cause analysis)
- [ ] Identifiser og implementer tekniske og organisatoriske forbedringer
- [ ] Oppdater risikovurdering for berørt system
- [ ] Gjennomgå om tredjepartsleverandør bidro til bruddet – eskalér til leverandør
- [ ] Vurder om rutinen for personvernbrudd bør oppdateres
- [ ] Informer styret / eiere dersom relevant

---

## Treningsanbefaling

Alle med tilgang til persondata bør kjenne til denne rutinen:
- [ ] Daglig leder: gjennomgått
- [ ] IT-ansvarlig: gjennomgått
- [ ] HR: gjennomgått

---

*Sist oppdatert: 2026-06-14*
