// Bransjespesifikke sjekklister for internkontroll-fagmoduler.
// Punktene er utformet etter forskrift om brannforebygging og forskrift om
// el-tilsyn (internkontroll elektriske anlegg). Brukes både til å vise hva
// modulen dekker, og til å registrere strukturerte kontrollresultater.

import type { InternkontrollKategori } from "@prisma/client";

export interface SjekkpunktMal {
  id: string;
  label: string;
  hjelp?: string;
}

export interface SjekkpunktResultat {
  id: string;
  label: string;
  ok: boolean;
  merknad?: string;
}

export interface Fagmodul {
  kategori: InternkontrollKategori;
  slug: string;
  navn: string;
  beskrivelse: string;
  /** Anbefalt kontrollintervall i dager (forhåndsutfylt ved nytt område). */
  anbefaltIntervalDager: number;
  punkter: SjekkpunktMal[];
}

export const BRANNVERN: Fagmodul = {
  kategori: "BRANNVERN",
  slug: "brannvern",
  navn: "Brannvern",
  beskrivelse:
    "Lovpålagt brannforebygging etter forskrift om brannforebygging. Jevnlig kontroll av rømningsveier, slokkeutstyr, varsling og rutiner.",
  anbefaltIntervalDager: 90,
  punkter: [
    { id: "romningsveier", label: "Rømningsveier er frie og tydelig merket", hjelp: "Ingen blokkering, ledelys fungerer." },
    { id: "slokkeutstyr", label: "Slokkeutstyr er på plass og trykk-kontrollert", hjelp: "Brannslokkere/​brannslanger innen kontrolldato." },
    { id: "roykvarslere", label: "Røykvarslere/brannalarm testet og fungerer" },
    { id: "nodlys", label: "Nødlys og ledesystem fungerer" },
    { id: "branninstruks", label: "Branninstruks og rømningsplan er oppdatert og synlig" },
    { id: "brannovelse", label: "Brannøvelse gjennomført siste 12 mnd" },
    { id: "elektrisk", label: "Ingen synlige elektriske faremomenter (varmgang, overbelastning)" },
    { id: "brannceller", label: "Branncellebegrensende dører lukker og er ikke kilt opp" },
  ],
};

export const EL_SIKKERHET: Fagmodul = {
  kategori: "EL_SIKKERHET",
  slug: "el-sikkerhet",
  navn: "El-sikkerhet",
  beskrivelse:
    "Internkontroll av elektriske anlegg etter forskrift om elektriske lavspenningsanlegg. Visuell kontroll, dokumentasjon og termografering.",
  anbefaltIntervalDager: 365,
  punkter: [
    { id: "visuell", label: "Visuell kontroll av tavler, kabler og kontakter uten skader" },
    { id: "jordfeil", label: "Jordfeilbrytere testet (testknapp)" },
    { id: "varmgang", label: "Ingen tegn til varmgang eller misfarging" },
    { id: "termografering", label: "Termografering utført av sertifisert kontrollør", hjelp: "Anbefalt for større anlegg, intervall etter risiko." },
    { id: "merking", label: "Sikringsskap er forskriftsmessig merket" },
    { id: "dokumentasjon", label: "Samsvarserklæring og anleggsdokumentasjon foreligger" },
    { id: "avvik_lukket", label: "Tidligere avvik fra el-kontroll er lukket" },
    { id: "kursfortegnelse", label: "Oppdatert kurs-/sikringsfortegnelse" },
  ],
};

export const FAGMODULER: Fagmodul[] = [BRANNVERN, EL_SIKKERHET];

export function fagmodulForKategori(kategori: string): Fagmodul | undefined {
  return FAGMODULER.find((m) => m.kategori === kategori);
}

export function fagmodulForSlug(slug: string): Fagmodul | undefined {
  return FAGMODULER.find((m) => m.slug === slug);
}
