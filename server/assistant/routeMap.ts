import type { Role } from "@prisma/client";

export interface RouteEntry {
  label: string;
  href: string;
  description: string;
  keywords: string[];
  roles: Role[];
}

const ALL_ROLES: Role[] = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
const HR_ADMIN: Role[] = ["ADMIN", "HR"];
const MGMT: Role[] = ["ADMIN", "HR", "MANAGER"];

export const ROUTE_MAP: RouteEntry[] = [
  // ── Alle ────────────────────────────────────────────────────────────────────
  { label: "Hjem / Dashboard",     href: "/dashboard",       description: "Startside med oversikt og oppgaver",           keywords: ["hjem", "dashboard", "start", "oversikt"],                roles: ALL_ROLES },
  { label: "Meld avvik",           href: "/avvik/ny",        description: "Rapporter et nytt HMS-avvik",                  keywords: ["avvik", "meld", "rapporter", "HMS", "ulykke", "hendelse", "skade"], roles: ALL_ROLES },
  { label: "Mine avvik",           href: "/avvik",           description: "Se dine og avdelingens avvik",                 keywords: ["avvik", "liste", "mine", "se"],                          roles: ALL_ROLES },
  { label: "Nytt fravær",          href: "/fravaer/ny",      description: "Send inn fraværssøknad eller egenmelding",     keywords: ["fravær", "egenmelding", "syk", "sykmelding", "permisjon", "ferie", "søknad"], roles: ALL_ROLES },
  { label: "Mitt fravær",          href: "/fravaer",         description: "Se dine fraværssøknader og saldo",             keywords: ["fravær", "liste", "mine", "saldo", "syk"],              roles: ALL_ROLES },
  { label: "Registrer overtid",    href: "/overtid/ny",      description: "Registrer overtid, avspasering eller reisetid", keywords: ["overtid", "avspasering", "reisetid", "beredskapsvakt", "tid"], roles: ALL_ROLES },
  { label: "Min overtid",          href: "/overtid",         description: "Se dine overtidsregistreringer",               keywords: ["overtid", "liste", "mine"],                             roles: ALL_ROLES },
  { label: "Personalhåndbok",      href: "/personalhandbok", description: "Les personalhåndboken",                        keywords: ["håndbok", "personalhandbok", "regler", "rutiner", "policy", "retningslinjer"], roles: ALL_ROLES },
  { label: "Dokumenter",           href: "/dokumenter",      description: "Tilgjengelige dokumenter og skjemaer",         keywords: ["dokumenter", "filer", "skjema"],                        roles: ALL_ROLES },
  { label: "Opplæring",            href: "/opplaering",      description: "Mine kurs og opplæringsplan",                  keywords: ["opplæring", "kurs", "sertifikat", "kompetanse"],        roles: ALL_ROLES },
  { label: "Stoffkartotek",        href: "/kjemikalier",     description: "Kjemikalier og HMS-datablad",                  keywords: ["kjemikalier", "kjemikalie", "stoff", "stoffkartotek", "datablad", "SDS"], roles: ALL_ROLES },
  { label: "Varsling",             href: "/varsling/ny",     description: "Varsle om kritikkverdige forhold",             keywords: ["varsling", "varsle", "kritikkverdig", "anonym", "bekymring"], roles: ALL_ROLES },
  { label: "Mine varsler",         href: "/varsler",         description: "Varsler og notifikasjoner",                    keywords: ["varsel", "varsler", "notifikasjon", "melding"],          roles: ALL_ROLES },
  { label: "Onboarding",           href: "/onboarding",      description: "Onboarding-oppgaver for nye ansatte",          keywords: ["onboarding", "ny ansatt", "oppgaver", "introduksjon"], roles: ALL_ROLES },
  { label: "Kontrakter",           href: "/kontrakter",      description: "Mine kontrakter og signaturer",                keywords: ["kontrakt", "signatur", "avtale"],                        roles: ALL_ROLES },
  { label: "Medarbeidersamtale",   href: "/medarbeidersamtaler", description: "Mine medarbeidersamtaler",               keywords: ["medarbeidersamtale", "samtale", "evaluering"],          roles: ALL_ROLES },
  { label: "Personvern",           href: "/personvern",      description: "Personvernerklæring og dine rettigheter",      keywords: ["personvern", "GDPR", "rettigheter", "data"],             roles: ALL_ROLES },
  { label: "Risikovurdering",      href: "/risiko",          description: "Se risikovurderinger",                         keywords: ["risiko", "risikovurdering", "ROS"],                      roles: ALL_ROLES },

  // ── Manager / HR / Admin ───────────────────────────────────────────────────
  { label: "Ansatte",              href: "/ansatte",           description: "Oversikt over alle ansatte",                 keywords: ["ansatte", "ansatt", "profil", "liste", "team"],         roles: MGMT },
  { label: "Rapporter",            href: "/rapporter",         description: "HMS- og HR-rapporter",                       keywords: ["rapport", "statistikk", "analyse"],                     roles: MGMT },
  { label: "Godkjenn overtid",     href: "/overtid/godkjenning", description: "Behandle innsendte overtidsregistreringer", keywords: ["godkjenning", "overtid", "behandle", "godkjenn"],   roles: MGMT },
  { label: "Sykefraværsoppfølging",href: "/sykefravaer",       description: "Oppfølging av langtidssykefravær",           keywords: ["sykefravær", "oppfølging", "AML", "dialogmøte"],        roles: MGMT },

  // ── HR / Admin ────────────────────────────────────────────────────────────
  { label: "Compliance",           href: "/admin/compliance",  description: "Compliance-oversikt og sjekklister",         keywords: ["compliance", "etterlevelse", "krav"],                   roles: HR_ADMIN },
  { label: "Onboarding-admin",     href: "/admin/onboarding",  description: "Administrer onboarding-prosesser",           keywords: ["onboarding", "admin", "ny ansatt", "prosess"],          roles: HR_ADMIN },
  { label: "Opplæringsadmin",      href: "/opplaering/admin",  description: "Administrer kurs og kompetanseregistrering", keywords: ["opplæring", "kurs", "admin"],                           roles: HR_ADMIN },
  { label: "Varslingssaker",       href: "/varsling/admin",    description: "Behandle varslingssaker",                    keywords: ["varsling", "admin", "saker"],                           roles: HR_ADMIN },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { label: "Systemstatus",         href: "/admin/system",      description: "Teknisk systemstatus",                       keywords: ["system", "status", "admin"],                            roles: ["ADMIN"] },
  { label: "Personalhåndbok-admin",href: "/personalhandbok/admin", description: "Rediger og publiser personalhåndbok",   keywords: ["håndbok", "admin", "rediger", "publiser"],              roles: ["ADMIN"] },
];

export function getRoutesForRole(role: Role): RouteEntry[] {
  return ROUTE_MAP.filter((r) => r.roles.includes(role));
}

export function findRelevantRoutes(query: string, role: Role, maxResults = 4): RouteEntry[] {
  const q = query.toLowerCase();
  const allowed = getRoutesForRole(role);

  const scored = allowed.map((route) => {
    let score = 0;
    for (const kw of route.keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 3 : 1;
    }
    if (q.includes(route.label.toLowerCase())) score += 5;
    if (q.includes(route.description.toLowerCase())) score += 2;
    return { route, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.route);
}
