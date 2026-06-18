import type { Role } from "@prisma/client";

export type AssistantRoute = {
  id: string;
  title: string;
  href: string;
  description: string;
  keywords: string[];
  roles?: Role[];
  aliases?: string[];
};

const ALL: Role[] = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
const MGMT: Role[] = ["ADMIN", "HR", "MANAGER"];
const HR_ADMIN: Role[] = ["ADMIN", "HR"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

export const ROUTE_MAP: AssistantRoute[] = [
  // ── Alle innloggede ──────────────────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Hjem / Dashboard",
    href: "/dashboard",
    description: "Startside med oversikt, oppgaver og nyheter",
    keywords: ["hjem", "start", "oversikt", "dashboard", "forside"],
    roles: ALL,
  },
  {
    id: "avvik",
    title: "Mine avvik",
    href: "/avvik",
    description: "Se avvik du har rapportert eller er involvert i",
    keywords: ["avvik", "hendelse", "nestenulykke", "ulykke", "skade", "uønsket hendelse", "rapportere", "melde", "registrere"],
    aliases: ["HMS-avvik", "avviksliste"],
    roles: ALL,
  },
  {
    id: "avvik_ny",
    title: "Meld nytt avvik",
    href: "/avvik/ny",
    description: "Rapporter et nytt HMS-avvik, nestenulykke eller forbedringspunkt",
    keywords: ["nytt avvik", "meld avvik", "rapporter avvik", "ny rapport", "nestenulykke", "ulykke", "skade", "farlig", "forbedring"],
    aliases: ["nytt HMS-avvik"],
    roles: ALL,
  },
  {
    id: "fravaer",
    title: "Mitt fravær",
    href: "/fravaer",
    description: "Se dine fraværssøknader, saldo og historikk",
    keywords: ["fravær", "syk", "sykefravær", "ferie", "permisjon", "borte", "egenmelding", "saldo", "fraværssaldo", "dager"],
    aliases: ["fraværsoversikt", "min fravær"],
    roles: ALL,
  },
  {
    id: "fravaer_ny",
    title: "Søk om fravær",
    href: "/fravaer/ny",
    description: "Send inn fraværssøknad, egenmelding eller ferieanmodning",
    keywords: ["nytt fravær", "søk fravær", "egenmelding", "meld syk", "jeg er syk", "sykmelding", "ferie søknad", "permisjonssøknad", "registrer fravær"],
    aliases: ["ny egenmelding", "ny ferieanmodning"],
    roles: ALL,
  },
  {
    id: "overtid",
    title: "Min overtid",
    href: "/overtid",
    description: "Se dine overtidsregistreringer og timebank",
    keywords: ["overtid", "timebank", "timer", "avspasering", "ekstra arbeid", "reisetid", "beredskapsvakt"],
    roles: ALL,
  },
  {
    id: "overtid_ny",
    title: "Registrer overtid",
    href: "/overtid/ny",
    description: "Registrer overtid, avspasering eller reisetid",
    keywords: ["registrer overtid", "ny overtid", "legg inn timer", "reisetid", "avspasering", "timeregistrering"],
    roles: ALL,
  },
  {
    id: "personalhandbok",
    title: "Personalhåndbok",
    href: "/personalhandbok",
    description: "Les interne regler, rutiner og retningslinjer",
    keywords: ["personalhåndbok", "håndbok", "regler", "rutiner", "policy", "retningslinjer", "interne regler", "ansattehåndbok"],
    aliases: ["HR-håndbok", "HMS-håndbok"],
    roles: ALL,
  },
  {
    id: "dokumenter",
    title: "Dokumenter",
    href: "/dokumenter",
    description: "Tilgjengelige dokumenter og skjemaer",
    keywords: ["dokumenter", "skjema", "filer", "vedlegg", "arkiv", "dokumentarkiv"],
    roles: ALL,
  },
  {
    id: "opplaering",
    title: "Opplæring",
    href: "/opplaering",
    description: "Mine kurs, opplæringsplan og kompetanseregistrering",
    keywords: ["opplæring", "kurs", "sertifikat", "kompetanse", "e-læring", "kursplan", "opplæringsplan"],
    roles: ALL,
  },
  {
    id: "kjemikalier",
    title: "Stoffkartotek / Kjemikalier",
    href: "/kjemikalier",
    description: "Kjemikalier, SDS-datablad og sikkerhetsinformasjon",
    keywords: ["kjemikalier", "kjemikalie", "stoff", "stoffkartotek", "sikkerhetsdatablad", "HMS-datablad", "SDS", "datablad", "renhold", "verneutstyr", "kjemisk"],
    aliases: ["sikkerhetsdatablad", "HMS-datablad"],
    roles: ALL,
  },
  {
    id: "varsling",
    title: "Varsling",
    href: "/varsling/ny",
    description: "Varsle om kritikkverdige forhold",
    keywords: ["varsling", "varsle", "kritikkverdig", "anonym", "alvorlig", "trakassering", "mobbing", "seksuell trakassering", "kritikkverdig forhold", "bekymring"],
    aliases: ["arbeidsmiljøvarsling"],
    roles: ALL,
  },
  {
    id: "varsler",
    title: "Mine varsler",
    href: "/varsler",
    description: "Notifikasjoner og varsler",
    keywords: ["varsler", "notifikasjon", "melding", "påminnelse", "alert"],
    roles: ALL,
  },
  {
    id: "personvern",
    title: "Personvern",
    href: "/personvern",
    description: "Personvernerklæring, GDPR og dine rettigheter",
    keywords: ["personvern", "GDPR", "data", "innsyn", "rettigheter", "sletting", "retting", "personopplysninger"],
    roles: ALL,
  },
  {
    id: "kontrakter_employee",
    title: "Mine kontrakter",
    href: "/kontrakter",
    description: "Se og signer dine arbeidskontrakter",
    keywords: ["kontrakt", "arbeidsavtale", "signering", "e-signering", "signere", "avtale"],
    roles: ALL,
  },
  {
    id: "risiko",
    title: "Risikovurdering",
    href: "/risiko",
    description: "Se risikovurderinger (ROS-analyse)",
    keywords: ["risiko", "risikovurdering", "ROS", "ros-analyse", "risikoanalyse", "kartlegging"],
    roles: ALL,
  },

  // ── MANAGER / HR / ADMIN ────────────────────────────────────────────────────
  {
    id: "ansatte",
    title: "Ansatte",
    href: "/ansatte",
    description: "Oversikt over alle ansatte",
    keywords: ["ansatte", "ansatt", "medarbeider", "liste", "team", "profil", "oversikt ansatte"],
    roles: MGMT,
  },
  {
    id: "rapporter",
    title: "Rapporter",
    href: "/rapporter",
    description: "HMS- og HR-rapporter og statistikk",
    keywords: ["rapport", "rapporter", "statistikk", "analyse", "oversikt", "HMS-rapport", "HR-rapport"],
    roles: MGMT,
  },
  {
    id: "overtid_godkjenning",
    title: "Godkjenn overtid",
    href: "/overtid/godkjenning",
    description: "Behandle og godkjenne innsendte overtidsregistreringer",
    keywords: ["godkjenn overtid", "godkjenning overtid", "behandle overtid", "innsendt overtid"],
    roles: MGMT,
  },
  {
    id: "sykefravaer",
    title: "Sykefraværsoppfølging",
    href: "/sykefravaer",
    description: "Oppfølging av langtidssykefravær",
    keywords: ["sykefraværsoppfølging", "oppfølging syk", "langtidssykefravær", "AML", "dialogmøte", "oppfølgingsplan"],
    roles: MGMT,
  },

  // ── HR / ADMIN ────────────────────────────────────────────────────────────
  {
    id: "kontrakter_admin",
    title: "Kontrakter (admin)",
    href: "/kontrakter",
    description: "Administrer kontrakter og e-signering",
    keywords: ["kontrakter admin", "administrer kontrakter", "opprett kontrakt"],
    roles: HR_ADMIN,
  },
  {
    id: "onboarding_admin",
    title: "Onboarding-admin",
    href: "/admin/onboarding",
    description: "Administrer onboarding-prosesser for nye ansatte",
    keywords: ["onboarding", "ny ansatt", "introduksjon", "onboarding-prosess", "oppstartsprosess"],
    roles: HR_ADMIN,
  },
  {
    id: "compliance",
    title: "Compliance",
    href: "/admin/compliance",
    description: "Compliance-oversikt og sjekklister",
    keywords: ["compliance", "etterlevelse", "sjekkliste", "krav", "lovkrav", "regelverk"],
    roles: HR_ADMIN,
  },
  {
    id: "varsling_admin",
    title: "Varslingssaker (admin)",
    href: "/varsling/admin",
    description: "Behandle innkomne varslingssaker",
    keywords: ["varslingssak", "behandle varsling", "varslingsmodul admin"],
    roles: HR_ADMIN,
  },

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  {
    id: "system",
    title: "Systemstatus",
    href: "/admin/system",
    description: "Teknisk systemstatus og administrasjon",
    keywords: ["system", "systemstatus", "admin", "teknisk", "konfigurasjon"],
    roles: ADMIN_ONLY,
  },
  {
    id: "avdelinger",
    title: "Avdelinger",
    href: "/admin/avdelinger",
    description: "Administrer avdelinger",
    keywords: ["avdeling", "avdelinger", "organisasjon", "struktur"],
    roles: ADMIN_ONLY,
  },
  {
    id: "personalhandbok_admin",
    title: "Personalhåndbok-admin",
    href: "/personalhandbok/admin",
    description: "Rediger og publiser personalhåndboken",
    keywords: ["personalhandbok admin", "rediger håndbok", "publiser håndbok", "oppdater regler"],
    roles: ADMIN_ONLY,
  },
];

export function getRoutesForRole(role: Role): AssistantRoute[] {
  return ROUTE_MAP.filter((r) => !r.roles || r.roles.includes(role));
}
