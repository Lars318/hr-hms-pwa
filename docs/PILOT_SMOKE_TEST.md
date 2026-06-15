# Pilot Smoke-test – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> Utføres av IT-ansvarlig og/eller pilotkoordinator på produksjonsmiljøet.  
> Hvert punkt: ✅ OK / ⚠️ Avvik (beskriv) / ❌ Feil (blokkerer)

---

## Merknader

> ⚠️ **E-signering er MOCK/TESTMODUS:** Signaturer er IKKE juridisk bindende. Ingen BankID eller ekte e-signeringstjeneste er tilkoblet.  
> ⚠️ **Lønnsintegrasjon:** Ikke implementert og ikke i scope.  
> ⚠️ **Teams og eksterne integrasjoner:** Ikke i scope.

---

## 1. Infrastruktur

```
□ /api/health → HTTP 200, db.status: "ok", latencyMs < 500
□ HTTPS aktiv (grønn hengelås)
□ Innloggingssiden laster uten feil
□ Ingen konsollfeil i nettleser ved første sidelasting
```

---

## 2. Autentisering

Test med alle roller:

```
ADMIN-bruker:
□ Innlogging → videresendes til /dashboard ✅
□ Utlogging → videresendes til /login ✅

HR-bruker:
□ Innlogging → /dashboard ✅

MANAGER-bruker:
□ Innlogging → /dashboard ✅

EMPLOYEE-bruker:
□ Innlogging → /dashboard ✅
□ Forsøk på /rapporter → redirect til /ingen-tilgang ✅
□ Forsøk på /admin/system → redirect til /ingen-tilgang ✅
□ Forsøk på /admin/personalsaker → redirect til /ingen-tilgang ✅
```

---

## 3. Dashboard per rolle

```
ADMIN:    □ Systemsnarveier synlige, systemside tilgjengelig
HR:       □ HR-nøkkeltall synlige, rapporter-snarvei tilgjengelig
MANAGER:  □ Avdelingens avvik/fravær/tiltak synlige
EMPLOYEE: □ Kun egne data synlige, ingen admin-lenker
```

---

## 4. Avvik

```
□ EMPLOYEE: kan opprette avvik
□ EMPLOYEE: ser kun egne avvik i listen
□ MANAGER: ser avvik for sin avdeling
□ HR/ADMIN: ser alle avvik
□ Vedlegg: last opp fil → nedlasting via signert URL fungerer
□ Vedlegg: direkte URL uten token → 400/403 fra Supabase
□ Status kan endres av ansvarlig/HR
□ Varsel sendes ved tildeling (sjekk in-app og e-post)
```

---

## 5. Risiko

```
□ HR/ADMIN: kan opprette risikovurdering
□ MANAGER: ser risikovurderinger for sitt område
□ EMPLOYEE: ser risikovurderinger for sin avdeling
□ Risikopunkter kan legges til
□ Kommentartråd (CommentThread) vises og fungerer
□ Intern kommentar skjult for EMPLOYEE
```

---

## 6. Tiltak

```
□ Tiltak kan opprettes (manuelt og fra risikopunkt)
□ EMPLOYEE ser kun egne tiltak
□ Status kan oppdateres
□ Kommentartråd (CommentThread) vises og fungerer
□ Fristoverskridelse vises korrekt
```

---

## 7. Dokumenter

```
□ HR/ADMIN: kan laste opp dokument
□ Alle roller: kan laste ned via signert URL
□ Direkte URL uten token → 400/403
□ Lesebekreftelse kan registreres av EMPLOYEE
□ Utløpende dokumenter vises med advarsel
```

---

## 8. Personalhåndbok

```
□ Sider og kategorier vises
□ Ansatte kan bekrefte lest
□ Admin kan publisere ny versjon
□ Versionshistorikk vises
```

---

## 9. Fravær

```
□ EMPLOYEE: kan sende fraværssøknad
□ MANAGER: kan godkjenne/avslå søknad
□ Godkjenning sender varsel til ansatt
□ Fraværskalender viser godkjente fravær
□ CSV-eksport fungerer for HR/ADMIN
```

---

## 10. Overtid og timebank

```
□ EMPLOYEE: kan registrere overtid
□ MANAGER: kan godkjenne/avslå
□ Timebankssaldo oppdateres korrekt
□ HR kan korrigere saldo via TimeBankAdjustment
□ Oversiktsside viser korrekt saldo per ansatt
```

---

## 11. HMS-opplæring

```
□ HR/ADMIN: kan opprette opplæringskurs
□ MANAGER: kan registrere gjennomføring for sine ansatte
□ EMPLOYEE: ser egne records og manglende obligatoriske kurs
□ Varsler for utløpende opplæring vises korrekt
□ Rapport «Opplæring» kan eksporteres som CSV
```

---

## 12. Stoffkartotek / Kjemikalier

```
□ HR/ADMIN: kan opprette kjemikalie
□ EMPLOYEE/MANAGER: kan se listen
□ Faremerkinger vises korrekt
□ SDS-referanse er synlig
□ Utløpende kjemikalier vises med advarsel
```

---

## 13. Varsling om kritikkverdige forhold

```
□ EMPLOYEE: kan sende varsling via /varsling/ny
□ EMPLOYEE: ser kun egne varsler
□ HR/ADMIN: ser alle varsler inkl. varsleridentitet
□ MANAGER: ser IKKE varsler (redirect)
□ Status kan oppdateres av HR/ADMIN
□ Varsel til HR sendes uten sensitiv innhold (sjekk e-post)
```

---

## 14. Onboarding / Offboarding

```
□ HR/ADMIN: kan opprette onboarding-mal
□ HR/ADMIN: kan starte onboarding-prosess for ansatt
□ EMPLOYEE: ser egne oppgaver og kan markere dem fullført
□ Varsler sendes ved tildeling av oppgave
□ Prosessen markeres fullført når alle oppgaver er utført
```

---

## 15. Medarbeidersamtaler

```
□ HR/MANAGER: kan opprette medarbeidersamtale
□ EMPLOYEE: ser kun egne samtaler
□ EMPLOYEE: kan fylle inn sharedNotes
□ MANAGER: kan fylle inn managerNotes
□ EMPLOYEE: kan IKKE se managerNotes (verifiser i network-tab)
□ Status kan endres av HR/ADMIN
```

---

## 16. Personalsaker / Advarsler

```
□ EMPLOYEE: forsøk på /admin/personalsaker → redirect ✅ (FORBIDDEN)
□ HR/ADMIN: ser alle personalsaker
□ MANAGER: ser saker for sin avdeling, men internalNote er null
□ HR: ser internalNote (verifiser i network-tab)
□ Audit-logg vises ved statusendring
```

---

## 17. Kontrakter

```
□ HR/ADMIN: kan opprette kontrakt
□ HR/ADMIN: kan laste opp kontraktsfil
□ Kontraktsfil laster ned via signert URL (300 sek utløp)
□ Direkte URL uten token → 400/403 fra Supabase
□ EMPLOYEE: ser IKKE kontrakt før HR deler den
□ HR: deler kontrakt → EMPLOYEE kan nå se og laste ned
□ EMPLOYEE: kan IKKE opprette eller dele kontrakter
```

---

## 18. E-signering (TESTMODUS)

> ⚠️ Kun mock — ingen ekte signatur. Ikke juridisk bindende.

```
□ HR: kan be om signatur på kontraktsfil
□ EMPLOYEE: ser "Signer (testmodus)"-knapp
□ EMPLOYEE: kan signere (mock) → status endres til SIGNED
□ EMPLOYEE: kan avslå
□ UI viser tydelig "(testmodus — ingen ekte signatur)"
□ Varsel sendes ved signert/avslått
```

---

## 19. GDPR / Personvern

```
□ /personvern tilgjengelig for alle roller
□ EMPLOYEE: kan sende datainnsyn-forespørsel
□ EMPLOYEE: ser egne forespørsler
□ HR/ADMIN: ser alle forespørsler under /personvern/foresporsler
□ HR kan oppdatere status og legge til merknad
□ Ansatt varsles når forespørsel er behandlet
```

---

## 20. Varsler / Notifications

```
□ In-app varsler vises i bjelle-ikon
□ Ulesete varsler vises med blå markering
□ Klikk på varsel markerer det som lest
□ E-postvarsel mottas ved nytt avvik (sjekk HR-bruker)
□ Push-varsler:
    □ EMPLOYEE kan aktivere push-varsler
    □ Testvarsel mottas på iOS (Safari)
    □ Testvarsel mottas på Android (Chrome)
```

---

## 21. Rapporter

```
□ HR/ADMIN: kan åpne /rapporter
□ CSV-eksport: avvik fungerer
□ CSV-eksport: fravær fungerer
□ CSV-eksport: overtid fungerer
□ CSV-eksport: opplæring fungerer
□ EMPLOYEE: redirect til /ingen-tilgang
```

---

## 22. PWA og mobil

```
□ Appen kan installeres på iOS (Safari → Del → Legg til på Hjem-skjerm)
□ Appen åpner i standalone-modus (ingen nettleser-UI)
□ Appen kan installeres på Android (Chrome → Installer app)
□ BottomNav er synlig på mobil (< 1024px)
□ Touch targets er store nok (min. 44px)
□ Offline-side vises ved manglende nettilkobling
```

---

## 23. Systemside og helse

```
□ ADMIN: /admin/system viser grønn DB-status
□ /api/health → 200 OK, db.status: "ok"
□ Sentry: test-feil sendes og dukker opp i Sentry-dashboard
□ Dashboard error boundary: korrekt feilside ved feil (ikke blank side)
```

---

## Resultatoppsummering

| Kategori | Resultat | Kommentar |
|---|---|---|
| Infrastruktur | | |
| Autentisering | | |
| RBAC (tilgangskontroll) | | |
| Kjernemoduler (avvik, risiko, tiltak) | | |
| HR-moduler (fravær, overtid, opplæring) | | |
| Sensitive moduler (kontrakter, personalsaker) | | |
| Mock e-signering | | |
| GDPR/personvern | | |
| Varsler | | |
| PWA/mobil | | |
| Storage og signerte URLer | | |

**Dato for smoke-test:** ___________  
**Utført av:** ___________  
**Resultat:** ✅ Klar / ⚠️ Avvik notert / ❌ Blokkert

---

*Sist oppdatert: 2026-06-15*
