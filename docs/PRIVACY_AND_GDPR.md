# Personvern og GDPR – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> **Merk:** Dette er teknisk og operativ dokumentasjon for organisasjonen – ikke juridisk godkjenning.  
> Juridisk gjennomgang anbefales av personvernombud eller advokat.

---

## 1. Formål med appen

HR/HMS PWA er et internt verktøy for:
- Systematisk HMS-arbeid (avvik, risikovurderinger, tiltak)
- Administrasjon av fravær og overtid/timebank
- Dokumentstyring og personalhåndbok
- Rollebasert varsling og rapportering
- Lokasjonsstyring for to treningssentre (Ski og Vestby)

Appen er **ikke** et komplett arbeidstidsregistreringssystem – den håndterer kun overtid og timebank. Full arbeidstidsregistrering håndteres i separate systemer.

---

## 2. Hvilke personopplysninger behandles

| Kategori | Eksempler | Hvem berøres | Sensitivitet |
|---|---|---|---|
| **Grunndata** | Navn, e-post, stilling, tittel | Alle ansatte | Lav |
| **Organisasjonstilknytning** | Avdeling, lokasjon, rolle, primærlokasjon | Alle ansatte | Lav |
| **Ansettelsesinfo** | Ansettelsesdato, status (ACTIVE/INACTIVE) | Alle ansatte | Lav |
| **Fravær** | Type, periode, dager, status | Ansatt + godkjenner | Middels (sykefravær er helseopplysning) |
| **Overtid/timebank** | Timer, type, dato, saldo, godkjenner | Ansatt + godkjenner | Lav |
| **Avvik** | Tittel, beskrivelse, alvorlighetsgrad, involvert person | Rapportør + berørte | Middels |
| **Risikovurderinger** | Tittel, beskrivelse, risikopunkter | HR/HMS/ADMIN | Lav |
| **Tiltak** | Tittel, ansvarlig, frist, status | Ansatt + HR | Lav |
| **Dokumenter** | Hvem har lest/bekreftet | Alle ansatte | Lav |
| **Varsler** | Innhold av varsler, lest-status | Mottaker | Lav |
| **Audit-logg** | Hvem gjorde hva, når | Alle brukere | Middels |
| **Push-notifikasjons-token** | Enhets-token for push | Ansatt | Lav |

**Særlige kategorier (art. 9):**  
Sykefravær kan anses som helseopplysning (særlig kategori). Type lagres som SICK_LEAVE. Appen lagrer ingen diagnose eller medisinsk informasjon.

---

## 3. Foreslåtte behandlingsgrunnlag

| Behandling | Foreslått grunnlag | Hjemmel |
|---|---|---|
| Fravær (godkjenning og statistikk) | Nødvendig for oppfyllelse av arbeidsavtale | GDPR art. 6(1)(b) + Aml §15-1 |
| Overtid/timebank | Nødvendig for oppfyllelse av arbeidsavtale | GDPR art. 6(1)(b) + Aml §10-6 |
| HMS (avvik, risiko, tiltak) | Rettslig forpliktelse | GDPR art. 6(1)(c) + IK-HMS-forskriften |
| Dokumentstyring og personalhåndbok | Rettslig forpliktelse / berettiget interesse | GDPR art. 6(1)(c)/(f) |
| Varsler og notifikasjoner | Berettiget interesse (driftsformål) | GDPR art. 6(1)(f) |
| Audit-logg | Berettiget interesse (sikkerhet/sporbarhet) | GDPR art. 6(1)(f) |
| Push-notifikasjoner | Samtykke | GDPR art. 6(1)(a) (innhentes i appen) |
| Sykefravær (særlig kategori) | Nødvendig av hensyn til sysselsetting | GDPR art. 9(2)(b) + Aml §4-6 |

> ⚠️ Behandlingsgrunnlag bør bekreftes av personvernombud eller juridisk rådgiver.

---

## 4. Hvem har tilgang til hva

| Rolle | Tilgang |
|---|---|
| **EMPLOYEE** | Egne data, dokumenter (offentlige), personalhåndbok, egne avvik, egne fraværssøknader, egne overtidsregistreringer |
| **MANAGER** | Alt EMPLOYEE har, pluss: avdelingsansattes fravær og overtid, tiltak de er ansvarlige for |
| **HR** | Alt data ekskl. system-admin. Se alle ansatte, all fravær, all overtid, alle avvik/risiko, rapporter, dokumenter |
| **HMS** (HR-rolle med HMS i tittel) | Tilsvarende HR, med HMS-fokusert dashboard og lokasjonskoblede varsler |
| **ADMIN** | Full tilgang inkl. systemstatus, audit-logg og administrasjon |

---

## 5. Rolle- og lokasjonsbasert tilgang

- Alle API-kall sjekker rolle via RBAC (server-side i tRPC-prosedyrer).
- Ansatte er knyttet til én eller flere lokasjoner via `ProfileAssignment`.
- Verneombud og HMS-ansvarlig er definert per lokasjon.
- Varsler om HMS-hendelser rutes til verneombud/HMS-ansvarlig for den aktuelle lokasjonen.
- Prisma kjører som postgres-superbruker og bypasser Supabase RLS – tilgangsstyring håndheves i applikasjonslaget.

---

## 6. Lagringstid og sletting

> ⚠️ Formell retention-policy er ikke definert ennå (P0-tiltak). Nedenfor er forslag basert på lovkrav og bransjepraksis.

| Kategori | Foreslått lagringstid | Hjemmel/begrunnelse |
|---|---|---|
| Ansatteprofil | Frem til ansettelsesforhold avsluttes + 3 år | Bokføringsloven, eventuelle krav |
| Fravær | 5 år | Aml-rapportering, statistikk |
| Overtid/timebank | 5 år | Lønnsgrunnlag, revisjonsformål |
| Avvik og tiltak | 5 år | IK-HMS, statistikk |
| Risikovurderinger | 5 år, eller til ny vurdering foreligger | IK-HMS |
| Dokumenter | Etter dokumentets relevansperiode + 3 år | Intern vurdering |
| Audit-logg | 2 år | Sikkerhet og sporbarhet |
| Push-tokens | Til ansatt deaktiverer eller avslutter | Samtykkebasert |

---

## 7. Innsyn og eksport

- HR/ADMIN kan eksportere data via CSV-eksport i rapportmodulen.
- Ansatte har per nå ikke self-service datainnsyn (P1-tiltak).
- Midlertidig: ansatte kan henvende seg til HR for innsyn i egne data.
- Forespørsler om innsyn skal besvares innen 30 dager (GDPR art. 12).

---

## 8. Retting av feil data

- HR/ADMIN kan redigere profiler og korrekte data i appen.
- Ansatt som ønsker retting henvender seg til HR.
- HR dokumenterer og gjennomfører retting.
- Retteforespørsler skal besvares innen 30 dager (GDPR art. 16).

---

## 9. Databehandlere

Alle databehandlere skal ha databehandleravtale (DPA) inngått. Status per 2026-06-14:

| Leverandør | Rolle | Hva de behandler | DPA-status |
|---|---|---|---|
| **Supabase** | Databehandler | Databasen (all data), autentisering, fillagring | ⬜ Skal inngås |
| **Vercel** | Databehandler | Applikasjonskjøring, serverside-rendering | ⬜ Skal inngås |
| **Resend** | Databehandler | E-postvarsler (navn, e-post, varselinnhold) | ⬜ Skal inngås |
| **Sentry** | Databehandler | Feillogging (kan inneholde persondata i stacktraces) | ⬜ Skal inngås |
| **Microsoft Teams** | Potensiell databehandler | Varsler hvis Teams-integrasjon bygges | Ikke aktuelt nå |
| **E-signeringsleverandør** | Potensiell databehandler | Kontrakter hvis modulen bygges | Ikke aktuelt nå |

---

## 10. Hvor data lagres

- **Database:** Supabase (PostgreSQL) – region EU (Frankfurt) som standard.
- **Fillagring:** Supabase Storage – samme region.
- **Applikasjonskjøring:** Vercel – region kan konfigureres (bruk EU-region).
- **Feillogging:** Sentry – region kan konfigureres (bruk EU-region).

> Bekreft at alle tjenester er konfigurert til EU-region for å sikre at data ikke overføres til tredjeland uten adekvat grunnlag (GDPR art. 44–46).

---

## 11. Sikkerhetstiltak

| Tiltak | Status |
|---|---|
| HTTPS (TLS) | ✅ Alle data krypteres i transport via Vercel/Supabase |
| Kryptering i hvile | ✅ Supabase krypterer data i hvile |
| Autentisering | ✅ Supabase Auth med e-post/passord |
| RBAC (rollebasert tilgang) | ✅ Håndheves server-side i alle tRPC-prosedyrer |
| Rate-limiting | ✅ Implementert på upload-endepunkter |
| CSP-headers | ✅ Content-Security-Policy, X-Frame-Options, HSTS (prod) |
| Signed URLs for filer | ✅ Alle filer nedlastes via signerte URL-er (60 sek.) |
| Audit-logg | ✅ Alle vesentlige handlinger logges |
| Passordpolicy | ⬜ Supabase-standard – bør strammes inn |
| 2-faktor autentisering | ⬜ Ikke implementert (P2) |
| Sårbarhetsskanning | ⬜ Ikke implementert (P2) |

---

## 12. Audit-logg

Appen logger følgende handlinger i `AuditLog`-tabellen:
- Dokument-opplastning, oppdatering og nedlasting
- Lesebekreftelse
- Avvik, risikovurdering og tiltaksendringer
- Fraværsgodkjenning/-avslag
- Overtidsgodkjenning/-avslag

Audit-logg er tilgjengelig for ADMIN via `/admin/system`.

---

## 13. Varsling ved personvernbrudd

Rutine (bør formaliseres av daglig leder):

1. **Oppdagelse:** Teknisk team varsler daglig leder umiddelbart.
2. **Vurdering:** Innen 24 timer – vurdere alvorlighetsgrad og omfang.
3. **Varsling Datatilsynet:** Innen 72 timer (GDPR art. 33) hvis bruddet medfører risiko for den registrerte.
4. **Varsling av berørte:** Dersom høy risiko – varsle berørte ansatte uten unødig opphold (art. 34).
5. **Dokumentasjon:** All kommunikasjon og tiltak dokumenteres.

Kontaktpunkt: Datatilsynet – [www.datatilsynet.no](https://www.datatilsynet.no)

---

## 14. Avgrensninger

| Område | Beskrivelse |
|---|---|
| **Arbeidstidsregistrering** | Appen håndterer kun overtid og timebank. Full daglig arbeidstidsregistrering (Aml §10-7) håndteres i separate systemer. |
| **AMU** | Arbeidsmiljøutvalg er ikke implementert og ikke aktuelt per i dag. |
| **BHT** | Bedriftshelsetjeneste er ikke integrert i appen. |
| **Lønnsdata** | Appen inneholder ingen lønnsinformasjon utover timer registrert i timebanken. |
| **Medisinske opplysninger** | Appen lagrer kun fraværstype (inkl. sykefravær) – ikke diagnose eller medisinsk informasjon. |

---

*Sist oppdatert: 2026-06-14*

---

## Regelbasert veiledningsassistent – personvernvurdering

**Løsning:** Ren regelbasert assistent (V1) uten ekstern AI-provider.

| Punkt | Status |
|---|---|
| Ekstern AI-tjeneste brukes | ❌ Nei |
| Data sendes til tredjepart | ❌ Nei |
| Samtaler lagres i database | ❌ Nei |
| Sensitive moduler brukes som datakilde | ❌ Nei (guard blokkerer) |
| Brukeren kan stille sensitive spørsmål | Ja, men guard returnerer standardsvar |
| DPIA-krav | Ikke aktuelt i V1 (ingen databehandler) |

**Sensitive moduler assistenten IKKE kan hente fra:**
PersonnelCase, EmployeeReview, Contract (innhold), SignatureRequest, WhistleblowingCase, LeaveRequest-detaljer, Overtime-detaljer, Incident fritekst, kommentarer, audit-logg.

**Dataminimering:** Assistenten henter kun rolle fra brukerens profil (for rollefiltrering). Ingen andre personopplysninger behandles i assistentflyten.
