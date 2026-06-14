# Statusoppsummering – HR/HMS PWA

**Til:** Daglig leder  
**Dato:** Juni 2026  
**Fra:** Teknisk prosjektansvarlig

---

## Hva vi har bygget

HR/HMS PWA er et internt digitalt verktøy for ansatte, ledere og HR. Det er tilgjengelig som en app på mobil og nettleser, uten installasjon fra App Store.

Systemet dekker:

- **Avvik og HMS** — ansatte rapporterer hendelser og farlige situasjoner. Leder og HMS-ansvarlig følger opp.
- **Risiko** — risikovurderinger per avdeling og treningssenter.
- **Tiltak** — oppfølging av konkrete forbedringstiltak.
- **Fravær** — fraværsregistrering med godkjenningsflyt (ikke erstatning for lønnssystem).
- **Overtid og timebank** — registrering av overtid, godkjenning og saldo.
- **Personalhåndbok** — digital håndbok med lesebekreftelse fra ansatte.
- **Dokumenter** — deling av interne dokumenter med kontrollert tilgang.
- **Varsling om kritikkverdige forhold** — intern varslingskanal for alvorlige hendelser, konfidensielt behandlet.
- **Varsler** — push-varsler til mobil og e-post ved viktige hendelser.

---

## Status per juni 2026

**Teknisk:** Klar. Bygget rent, 0 feil, testet på mobil og nettleser.

**Juridisk:** Delvis klar. Personvernsdokumentasjon er utarbeidet, men tre ting gjenstår som **ledelsesbeslutninger**:

| Hva | Hvorfor det haster |
|---|---|
| Databehandleravtaler (DPA) med Supabase, Vercel, Resend og Sentry | GDPR art. 28 — obligatorisk før personopplysninger behandles i disse systemene |
| Juridisk bekreftelse av behandlingsgrunnlag | Særlig sykefravær (sensitive personopplysninger, GDPR art. 9) |
| Godkjenning av lagringspolicy | Når skal data slettes? |

Ingen av disse krever teknisk arbeid — de er administrative og juridiske oppgaver.

---

## Anbefalt neste steg

1. **Inngå DPA-er** med Supabase, Vercel, Resend og Sentry (alle har standardavtaler klare for signering).
2. **Få juridisk bekreftelse** av behandlingsgrunnlag, eventuelt fra arbeidsrettsadvokat.
3. **Sett opp produksjonsmiljø** (Supabase prod-prosjekt, Vercel prod-variabler).
4. **Start begrenset pilot** med 5–10 ansatte fra én lokasjon.

---

## Hva vi ikke bygger (bevisst)

- Teams, Microsoft Graph og andre eksterne samhandlingsverktøy er ikke i scope.
- Lønn og økonomi håndteres av eksisterende systemer.
- Full ekstern anonym varslingskanal er ikke bygget — kun intern pilot.

---

*Fullstendig teknisk dokumentasjon finnes i `docs/`-mappen.*
