import type { Role } from "@prisma/client";
import { getRoutesForRole, type AssistantRoute } from "./routeMap";

export type Confidence = "high" | "medium" | "low";

export interface MatchResult {
  answer: string;
  suggestedLinks: { label: string; href: string; description?: string }[];
  sources: { title: string; href?: string; type: "route" | "static" | "handbook" | "document" }[];
  confidence: Confidence;
  usedAi: false;
}

// ── Sensitive-spørsmål guard ──────────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
  /personalsak/i,
  /personnelcase/i,
  /medarbeidersamtale.*(til|for|om)\s+\w/i,
  /kontrakt.*(til|for|om)\s+\w/i,
  /varslingsak/i,
  /whistle/i,
  /hva.*(tjener|lønn|salary)/i,
  /lønn.*(til|for|om)\s+\w/i,
  /diagnose/i,
  /sykmelding.*(til|for|om)\s+\w/i,
  /audit.?log/i,
];

function isSensitive(q: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(q));
}

// ── Predefined Q&A ───────────────────────────────────────────────────────────
interface QA {
  id: string;
  keywords: string[];
  answer: string;
  links: { label: string; href: string }[];
  roles?: Role[];
}

const QA_LIST: QA[] = [
  {
    id: "avvik_meld",
    keywords: ["meld avvik", "rapporter avvik", "nytt avvik", "registrere avvik", "hva gjør jeg ved avvik", "nestenulykke", "ulykke", "skade", "HMS-hendelse", "uønsket hendelse"],
    answer:
      "Du melder avvik under **Avvik → Meld nytt avvik**. Avvik brukes for uønskede hendelser, nestenulykker, skader, farlige forhold og forbedringspunkter. Jo raskere du melder, jo bedre kan vi forebygge gjentakelse.",
    links: [
      { label: "Meld nytt avvik", href: "/avvik/ny" },
      { label: "Mine avvik", href: "/avvik" },
    ],
  },
  {
    id: "fravaer_egenmelding",
    keywords: ["egenmelding", "meld syk", "jeg er syk", "er syk", "syk i dag", "meld inn syk"],
    answer:
      "Du kan melde egenmelding direkte fra dashboardet med «Jeg er syk i dag»-knappen, eller gå til **Fravær → Søk om fravær** og velg Egenmelding. Egenmeldingen godkjennes automatisk — du trenger ikke vente på leder.",
    links: [
      { label: "Søk om fravær", href: "/fravaer/ny" },
      { label: "Mitt fravær", href: "/fravaer" },
    ],
  },
  {
    id: "fravaer_ferie",
    keywords: ["søk ferie", "ferieanmodning", "ferie søknad", "planlegge ferie", "feriedager", "ferie permisjon", "søke ferie"],
    answer:
      "Feriesøknad sendes under **Fravær → Søk om fravær** og velg type Ferie. Søknaden går til leder for godkjenning. Du kan se saldo og godkjente perioder under Mitt fravær.\n\nFerieloven gir rett til 25 virkedager ferie per år (4,2 uker). Arbeidsgiver skal varsle om ferietidspunkt senest 2 måneder i forveien.",
    links: [
      { label: "Søk om ferie", href: "/fravaer/ny" },
      { label: "Mitt fravær", href: "/fravaer" },
    ],
  },
  {
    id: "fravaer_permisjon",
    keywords: ["permisjon", "søk permisjon", "foreldrepermisjon", "omsorgspermisjon", "velferdspermisjon", "pappapermisjon", "mammapermisjon"],
    answer:
      "Permisjonssøknad sendes under **Fravær → Søk om fravær** og velg aktuell type (Permisjon, Foreldrepermisjon e.l.). Søknaden går til leder og HR for behandling.\n\nFor juridisk avklaring om permisjonsrettigheter, se personalhåndboken eller kontakt HR.",
    links: [
      { label: "Søk om permisjon", href: "/fravaer/ny" },
      { label: "Personalhåndbok", href: "/personalhandbok" },
    ],
  },
  {
    id: "overtid_registrer",
    keywords: ["registrer overtid", "ny overtid", "legg inn timer", "reisetid", "avspasering", "beredskapsvakt", "ekstra timer"],
    answer:
      "Overtid registreres under **Overtid → Registrer overtid**. Du kan registrere overtid, avspasering, reisetid og beredskapsvakt. Registreringen sendes til leder for godkjenning.",
    links: [
      { label: "Registrer overtid", href: "/overtid/ny" },
      { label: "Min overtid", href: "/overtid" },
    ],
  },
  {
    id: "overtid_godkjenn",
    keywords: ["godkjenn overtid", "behandle overtid", "innsendt overtid", "godkjenning av overtid"],
    answer:
      "Som leder godkjenner du innsendt overtid under **Overtid → Godkjenning**. Der ser du alle ventende registreringer fra dine ansatte.",
    links: [{ label: "Godkjenn overtid", href: "/overtid/godkjenning" }],
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    id: "varsling",
    keywords: ["varsle", "varsling", "kritikkverdig", "trakassering", "mobbing", "seksuell trakassering", "alvorlig", "anonym varsling"],
    answer:
      "Bruk **Varsling** hvis saken gjelder kritikkverdige forhold i arbeidslivet — trakassering, mobbing, lovbrudd, alvorlige HMS-brudd e.l. Du kan varsle anonymt.\n\nEr du usikker på om forholdet kvalifiserer som varsling? Les rutinen i personalhåndboken eller ta kontakt med HR.",
    links: [
      { label: "Send varsling", href: "/varsling/ny" },
      { label: "Personalhåndbok", href: "/personalhandbok" },
    ],
  },
  {
    id: "personalhandbok",
    keywords: ["regler", "rutiner", "policy", "retningslinjer", "interne regler", "håndbok", "personalhåndbok", "finne regler"],
    answer:
      "Interne regler, rutiner og retningslinjer finner du i **Personalhåndboken**. Der ligger bl.a. HMS-rutiner, permisjonsregler, feriepolicy og varslingsrutine.\n\nSpesifikke skjemaer og vedlegg ligger i **Dokumenter**.",
    links: [
      { label: "Personalhåndbok", href: "/personalhandbok" },
      { label: "Dokumenter", href: "/dokumenter" },
    ],
  },
  {
    id: "kjemikalier",
    keywords: ["kjemikalier", "stoffkartotek", "sikkerhetsdatablad", "HMS-datablad", "SDS", "kjemikalie", "renhold", "rengjøring", "kjemisk stoff"],
    answer:
      "Sikkerhetsdatablad og kjemikalieinfo finner du i **Stoffkartotek / Kjemikalier**. Her ligger SDS-datablad for alle kjemikalier vi bruker. Bruk dette før du håndterer ukjente stoffer.",
    links: [{ label: "Stoffkartotek", href: "/kjemikalier" }],
  },
  {
    id: "kontrakt",
    keywords: ["kontrakt", "arbeidsavtale", "signere", "signering", "e-signering", "se kontrakt", "min kontrakt"],
    answer:
      "Dine kontrakter og signaturforespørsler finner du under **Kontrakter**. Der kan du se og signere aktive kontrakter digitalt.",
    links: [{ label: "Kontrakter", href: "/kontrakter" }],
  },
  {
    id: "personvern",
    keywords: ["personvern", "GDPR", "innsyn", "rettigheter", "mine data", "slette data", "rette data", "personopplysninger"],
    answer:
      "Informasjon om personvern, dine GDPR-rettigheter og hvordan vi behandler personopplysninger finner du under **Personvern**. Du har bl.a. rett til innsyn, retting og sletting av dine opplysninger.",
    links: [{ label: "Personvern", href: "/personvern" }],
  },
  {
    id: "passord",
    keywords: ["passord", "glemt passord", "reset passord", "tilbakestille passord", "logg inn", "innlogging", "kan ikke logge inn", "login"],
    answer:
      "Passordtilbakestilling gjøres på **innloggingssiden** — klikk «Glemt passord» og følg instruksjonene på e-post. Fungerer ikke det, ta kontakt med din administrator.",
    links: [{ label: "Innlogging", href: "/login" }],
  },
  {
    id: "opplaering",
    keywords: ["opplæring", "kurs", "sertifikat", "kompetanse", "e-læring", "kursplan", "kursbevis"],
    answer:
      "Kurs og opplæringsplan finner du under **Opplæring**. Der ser du pålagte og anbefalte kurs, og kan registrere fullførte kurs og sertifikater.",
    links: [{ label: "Opplæring", href: "/opplaering" }],
  },
  {
    id: "risiko",
    keywords: ["risikovurdering", "ROS", "ros-analyse", "risikoanalyse", "kartlegge risiko", "fareidentifikasjon"],
    answer:
      "Risikovurderinger (ROS-analyser) finner du under **Risikovurdering**. HMS-ansvarlig og leder bruker dette for systematisk kartlegging av arbeidsrelatert risiko.",
    links: [{ label: "Risikovurdering", href: "/risiko" }],
  },
  {
    id: "ansatte",
    keywords: ["finn ansatt", "se ansatte", "ansattliste", "medarbeiderliste", "hvem jobber her", "kontakt kollega"],
    answer:
      "Ansattoversikten finner du under **Ansatte**. Du kan søke, filtrere på rolle og lokasjon, og klikke på en ansatt for å se profil og kontaktinfo.",
    links: [{ label: "Ansatte", href: "/ansatte" }],
    roles: ["ADMIN", "HR", "MANAGER"],
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreRoute(route: AssistantRoute, words: string[], qNorm: string): number {
  let score = 0;
  for (const kw of route.keywords) {
    if (qNorm.includes(kw.toLowerCase())) score += kw.split(" ").length > 1 ? 4 : 2;
  }
  for (const alias of route.aliases ?? []) {
    if (qNorm.includes(alias.toLowerCase())) score += 3;
  }
  for (const word of words) {
    if (route.title.toLowerCase().includes(word)) score += 1;
  }
  return score;
}

function scoreQA(qa: QA, words: string[], qNorm: string): number {
  let score = 0;
  for (const kw of qa.keywords) {
    const kwLower = kw.toLowerCase();
    if (qNorm.includes(kwLower)) {
      score += kwLower.split(" ").length > 1 ? 5 : 2;
    }
  }
  return score;
}

// ── Main matcher ──────────────────────────────────────────────────────────────
export function match(question: string, role: Role): MatchResult {
  const qNorm = question.toLowerCase().trim();
  const words = qNorm.split(/\s+/).filter((w) => w.length > 2);

  // Sensitive guard
  if (isSensitive(qNorm)) {
    return {
      answer:
        "Jeg kan ikke hente eller oppsummere sensitive personalsaker, medarbeidersamtaler, kontrakter eller varslingssaker. Gå til riktig modul hvis du har tilgang, eller kontakt HR direkte.",
      suggestedLinks: [],
      sources: [],
      confidence: "high",
      usedAi: false,
    };
  }

  const allowedRoutes = getRoutesForRole(role);

  // Score QAs
  const allowedQAs = QA_LIST.filter((qa) => !qa.roles || qa.roles.includes(role));
  const scoredQAs = allowedQAs
    .map((qa) => ({ qa, score: scoreQA(qa, words, qNorm) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Score routes
  const scoredRoutes = allowedRoutes
    .map((r) => ({ route: r, score: scoreRoute(r, words, qNorm) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const bestQA = scoredQAs[0];
  const topRoutes = scoredRoutes.slice(0, 3);

  // High confidence: QA hit
  if (bestQA && bestQA.score >= 4) {
    const suggestedLinks = bestQA.qa.links.filter((l) =>
      allowedRoutes.some((r) => r.href === l.href)
    );
    // Add route matches not already in QA links
    for (const { route } of topRoutes) {
      if (!suggestedLinks.some((l) => l.href === route.href) && suggestedLinks.length < 4) {
        suggestedLinks.push({ label: route.title, href: route.href });
      }
    }
    return {
      answer: bestQA.qa.answer,
      suggestedLinks,
      sources: suggestedLinks.map((l) => ({ title: l.label, href: l.href, type: "route" as const })),
      confidence: "high",
      usedAi: false,
    };
  }

  // Medium confidence: route matches only
  if (topRoutes.length > 0) {
    const suggestedLinks = topRoutes.map(({ route }) => ({
      label: route.title,
      href: route.href,
      description: route.description,
    }));
    return {
      answer: `Jeg fant disse stedene som kan være relevante for spørsmålet ditt:`,
      suggestedLinks,
      sources: suggestedLinks.map((l) => ({ title: l.label, href: l.href, type: "route" as const })),
      confidence: "medium",
      usedAi: false,
    };
  }

  // Low confidence: fallback
  const fallbackLinks = allowedRoutes
    .filter((r) => ["personalhandbok", "dokumenter", "dashboard"].includes(r.id))
    .slice(0, 3)
    .map((r) => ({ label: r.title, href: r.href, description: r.description }));

  return {
    answer:
      "Jeg finner ikke et godt svar på dette spørsmålet i tilgjengelige kilder. Prøv å søke i personalhåndboken, se i dokumentarkivet, eller kontakt HR direkte for hjelp.",
    suggestedLinks: fallbackLinks,
    sources: [],
    confidence: "low",
    usedAi: false,
  };
}
