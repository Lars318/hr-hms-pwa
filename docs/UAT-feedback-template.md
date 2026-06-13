# UAT Tilbakemeldingsskjema — HR/HMS PWA

Fyll ut ett skjema per funn. Bruk kopier-og-lim fra malen under.

---

## Informasjon om testeren

| Felt | Verdi |
|------|-------|
| **Navn/rolle** | |
| **Systemrolle** | ADMIN / HR / MANAGER / EMPLOYEE |
| **Dato** | |
| **Nettleser/enhet** | f.eks. Chrome 126 / Windows 11 |
| **Testmiljø** | Staging-URL |

---

## Funnet

| Felt | Verdi |
|------|-------|
| **Scenario-ID** | f.eks. E2, H1, M3 |
| **Scenariotittel** | f.eks. "Last opp vedlegg" |

### Steg utført

Beskriv hva du gjorde, steg for steg:

1.
2.
3.

### Forventet resultat

Hva forventet du skulle skje?

### Faktisk resultat

Hva skjedde faktisk? Beskriv eventuell feilmelding, uventet oppførsel eller manglende funksjonalitet.

### Alvorlighet

- [ ] **Blokkerende** — Kan ikke bruke funksjonaliteten, data kan gå tapt, sikkerhetsproblem
- [ ] **Kritisk** — Viktig funksjon er brutt, workaround finnes
- [ ] **Middels** — Funksjon er delvis brutt eller forvirrende
- [ ] **Lav** — Kosmetisk feil, liten UX-ulempe
- [ ] **Forbedringsforslag** — Fungerer, men kan bli bedre

### Reproduserbar?

- [ ] Alltid
- [ ] Av og til
- [ ] Én gang

### Skjermbilde / video

Legg ved skjermbilde eller skjermopptaklenke her (Last opp til GitHub-issue, Slack e.l.):

### Forslag til forbedring

Har du et konkret forslag til løsning eller forbedring?

---

---

## Mal for rask rapportering (kopier under)

```
## Funn [scenario-ID] — [kort tittel]

**Tester:** [navn/rolle]  
**Dato:** [dato]  
**Scenario:** [scenario-ID og tittel]  
**Alvorlighet:** Blokkerende / Kritisk / Middels / Lav / Forbedringsforslag

**Steg:**
1. 
2. 
3. 

**Forventet:** 

**Faktisk:** 

**Skjermbilde:** [lenke eller "vedlagt"]
```

---

## Eksempel på utfylt skjema

```
## Funn E2 — Vedlegg kan ikke lastes ned

**Tester:** Emil Employeesen (EMPLOYEE)
**Dato:** 2024-06-15
**Scenario:** E2 – Last opp vedlegg
**Alvorlighet:** Kritisk

**Steg:**
1. Logget inn som ansatt@staging.example.com
2. Gikk til /avvik/1
3. Lastet opp en PDF (200 KB)
4. Klikket nedlastingsikonet

**Forventet:** PDF åpnes i ny fane via signert URL

**Faktisk:** Nettleseren viser "403 Forbidden". 
Feilmelding i console: "storage/object/sign: Row Level Security violation"

**Skjermbilde:** [skjermbilde-url]
```
