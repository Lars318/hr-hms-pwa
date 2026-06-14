# Compliance Gap-analyse – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> **Formål:** Praktisk vurdering av HMS-/arbeidsrett- og GDPR-gap for appen slik den faktisk brukes.  
> **Viktig:** Dette er teknisk og operativ dokumentasjon – ikke juridisk rådgivning eller garanti.  
> **Avgrensning:** Arbeidstidsregistrering, AMU og BHT er bevisst utenfor scope – se eget punkt.

---

## Avgrensninger – utenfor scope nå

| Område | Begrunnelse |
|---|---|
| **Arbeidstidsregistrering** | Håndteres i andre systemer. Appen håndterer kun overtid/timebank-del av arbeidstid. |
| **AMU – Arbeidsmiljøutvalg** | Ikke aktuelt for virksomhetens størrelse/struktur per i dag. |
| **BHT – Bedriftshelsetjeneste** | Ikke aktuelt per i dag. |

---

## Gap-analyse

### HMS og internkontroll

| Område | Status i appen | Dekket | Mangler | Risiko | Anbefalt tiltak | Prioritet | Kommentar |
|---|---|---|---|---|---|---|---|
| **1. Internkontroll / HMS-systematikk** | Avvik, risiko, tiltak, dokumenter, personalhåndbok og rapporter dekker kjernen i internkontrollforskriften (IK-HMS). Audit-logg sikrer sporbarhet. | ✅ Delvis | Ingen samlet «internkontroll-status»-visning for leder. Ingen automatisk årsgjennomgang-påminnelse. | Middels | Legg til compliance-dashboard (P1). Vurder årsgjennomgang-notifikasjon. | P1 | IK-HMS §5 krever systematisk gjennomgang. Appen har byggesteinene, men mangler samlet oversikt. |
| **2. HMS-regelverk tilgjengelig for ansatte** | Personalhåndbok og dokumentarkiv er tilgjengelig for alle ansatte. Lesebekreftelse spores. | ✅ God | Ingen dedikert «HMS-informasjon»-seksjon for ansatte på dashboard. | Lav | Legg til HMS-snarvei på ansatt-dashboard (P2). | P2 | Dekket via personalhåndbok + dokumenter. |
| **3. Risikovurdering** | Risikomodul med risikopunkter, sannsynlighet/konsekvens og tiltak. | ✅ God | Ingen periodisk revurdering-påminnelse. Ikke knyttet til spesifikk lokasjoner i full bredde. | Middels | Legg til «sist revidert»-felt og påminnelse (P1). | P1 | Aml §3-1 krever løpende risikovurdering. |
| **4. Avvik og tiltak** | Full avviksmodul med status, alvorlighetsgrad, ansvarlig og frist. Tiltak kobles til avvik og risikovurderinger. | ✅ God | Ingen statistikk over gjentakende avvik. Ingen automatisk eskalering ved fristbrudd. | Middels | Fristbrudd-notifikasjon (P1). Avvikstrend-rapport (P2). | P1 | Dekker IK-HMS §5 pkt. 7. |
| **5. Verneombud per lokasjon** | Verneombud og HMS-ansvarlig er definert per lokasjon. Varsler rutes til riktig verneombud ved avvik/risiko på lokasjonen. | ✅ God | Ingen historikk over hvem som var verneombud på et gitt tidspunkt. | Lav | Logg verneombudsendringer (P2). | P2 | Aml §6-1. Løsningen er god for nåværende behov. |
| **6. Personalhåndbok og lesebekreftelse** | Versjonsstyrt personalhåndbok. Lesebekreftelse per ansatt spores. HR kan se hvem som ikke har lest. | ✅ God | Ingen automatisk purring til uleste ansatte. | Lav | Automatisk purrenotifikasjon (P2). | P2 | Over lovkrav for de fleste virksomheter. |
| **7. Fravær** | Fraværsmodul med godkjenningsflyt, kalender og rapporter. | ✅ God | Ingen langtidsfraværsoppfølging (dialogmøte-påminnelse etter 4/8 uker). | Middels | Langtidsfraværsoppfølging (P1). | P1 | Aml §4-6 og NAV-krav om oppfølgingsplan. |
| **8. Overtid/timebank** | Overtid-modul med registrering, godkjenning og timebanksaldo. | ✅ Delvis | **Appen er ikke full arbeidstidsregistrering.** Ingen integrasjon med lønnssystem. Ingen grensevarsler (Aml §10-6). | Høy | Tydelig avgrensning i UI (er gjort). Grensevarsler kan vurderes (P2). | P0/kommentar | Aml §10-6: max 10t/dag, 50t/uke, 300t/år overtid. Appen registrerer overtid men kontrollerer ikke grenser automatisk. |
| **9. Varsling om kritikkverdige forhold** | Ingen dedikert varslingsmodul (whistleblowing). | ❌ Mangler | Varslingskanal for kritikkverdige forhold (Aml §2A). | Høy | Bygg varslingsmodul (P1). | P1 | Aml §2A-2 krever tilrettelegging for varsling. Midlertidig løsning: ekstern e-post. |
| **10. HMS-opplæring / kompetanse** | Ingen opplæringsregister. | ❌ Mangler | Register over hvem som har fått HMS-opplæring, og når. | Middels | Bygg HMS-opplæringsregister (P1). | P1 | Aml §3-5 krever opplæring av ledere og verneombud. |
| **11. Stoffkartotek / kjemikalier** | Ingen stoffkartotek-modul. | ❌ Mangler | For treningssentre med renholdsavdeling: kjemikalier og sikkerhetsdatablader. | Middels (avhengig av kjemikaliebruk) | Bygg stoffkartotek (P1). | P1 | Forskrift om utførelse av arbeid §§ 2-1 ff. Relevant for renholdsavdeling. |
| **12. Dokumentstyring og versjoner** | Dokumentarkiv med versjonsnummer, kategori og synlighet. Lesebekreftelse. | ✅ God | Ingen automatisk utløpsvarsling (selv om `expiresAt`-felt finnes). | Lav | Aktiver utløpsvarsling (P1). | P1 | Feltet finnes, varslingen mangler. |
| **13. Rapporter og sporbarhet** | CSV-eksport for avvik, tiltak, risiko, fravær, overtid og dokumentlesing. Audit-logg for alle handlinger. | ✅ God | Ingen automatisk rapport til leder/HR månedlig. | Lav | Planlagte rapporter (P2). | P2 | Over minstekrav. |

---

### GDPR og personvern

| Område | Status i appen | Dekket | Mangler | Risiko | Anbefalt tiltak | Prioritet | Kommentar |
|---|---|---|---|---|---|---|---|
| **14. GDPR behandlingsgrunnlag** | Ingen formell dokumentasjon av behandlingsgrunnlag per behandling. | ❌ Mangler | Dokumentert behandlingsgrunnlag (Aml/GDPR art. 6) for hver personopplysningskategori. | Høy | Dokumenter behandlingsgrunnlag (P0). | P0 | Se PRIVACY_AND_GDPR.md for forslag. |
| **15. GDPR dataminimering** | Datamodellen samler bare nødvendige felter. Ingen unødvendige persondata. | ✅ God | Ingen formell vurdering av om alle felt er nødvendige. | Lav | Gjennomgå datamodell mot formål (P1). | P1 | Ser ryddig ut, men bør formaliseres. |
| **16. GDPR lagringstid/sletting** | Ingen automatisk sletting. Data beholdes til manuell sletting. | ❌ Mangler | Definert lagringstid per kategori. Automatisk eller manuell rutine for sletting. | Høy | Dokumenter retention policy (P0). Bygg slette-admin (P1). | P0/P1 | GDPR art. 5(1)(e). |
| **17. GDPR innsyn/eksport** | CSV-eksport (HR-admin). Ingen funksjon for at ansatt eksporterer egne data. | ❌ Delvis | Self-service datainnsyn for ansatte. | Middels | Bygg «mine data»-eksport (P1). | P1 | GDPR art. 15. Kan midlertidig håndteres manuelt av HR. |
| **18. GDPR retting** | HR/ADMIN kan redigere profiler og data. | ✅ Delvis | Ingen strukturert prosess for ansatt å be om retting. | Lav | Dokumenter prosess for rettingsforespørsel (P0). | P0 | GDPR art. 16. Prosessen kan beskrives i personvernerklæring. |
| **19. GDPR tilgangsstyring** | RBAC med 4 roller (ADMIN, HR, MANAGER, EMPLOYEE). Lokasjonsbasert ansatttilknytning. | ✅ God | Ingen tidsbegrenset tilgang for avsluttede ansettelsesforhold. | Middels | Automatisk deaktivering ved avsluttet ansettelse (P1). | P1 | Status-felt finnes (ACTIVE/INACTIVE). Bør settes ved offboarding. |
| **20. GDPR logging/audit** | Audit-logg for alle vesentlige handlinger (dokument-nedlasting, avvik, tiltak, fravær). | ✅ God | Audit-logg er ikke tilgjengelig for granskning for vanlige brukere (kun admin). | Lav | Audit-logg tilgjengelig for ADMIN (P1). | P1 | Bra dekning. Admin-tilgang er neste steg. |
| **21. GDPR databehandleravtaler** | Ingen dokumenterte DPA-er i appen. | ❌ Mangler | Databehandleravtaler med Supabase, Vercel, Resend, Sentry. | Høy | Inngå/dokumentere DPA-er (P0). | P0 | GDPR art. 28. Juridisk plikt. |
| **22. GDPR sikkerhetstiltak** | HTTPS (Vercel), Supabase-kryptering i hvile og transport, CSP-headers, rate-limiting, signed URLs for filer. | ✅ God | Ingen formell sikkerhetsvurdering (DPIA). | Middels | Dokumenter sikkerhetstiltak (P0). Vurder DPIA (P1). | P0 | God teknisk baseline. Mangler formell dokumentasjon. |
| **23. GDPR personvernbrudd** | Ingen rutine i appen for håndtering av personvernbrudd. | ❌ Mangler | Rutine for å oppdage, dokumentere og varsle Datatilsynet innen 72t. | Høy | Dokumenter rutine (P0). | P0 | GDPR art. 33–34. |

---

## Oppsummering – risikonivå

| Risiko | Antall gap |
|---|---|
| 🔴 Høy | 5 (behandlingsgrunnlag, DPA-er, personvernbrudd, lagringstid, varslingsmodul) |
| 🟡 Middels | 7 |
| 🟢 Lav | 11 |

---

*Sist oppdatert: 2026-06-14*
