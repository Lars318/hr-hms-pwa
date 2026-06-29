// Enkel, robust CSV-parser for klient-side import.
// Håndterer anførselstegn med innebygde skilletegn/linjeskift, BOM, og
// auto-detektert skilletegn (semikolon eller komma).

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

function detectDelimiter(firstLine: string): string {
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  return semi >= comma ? ";" : ",";
}

export function parseCsv(text: string): ParsedCsv {
  // Fjern BOM
  const clean = text.replace(/^﻿/, "");
  const firstLineEnd = clean.search(/\r?\n/);
  const firstLine = firstLineEnd === -1 ? clean : clean.slice(0, firstLineEnd);
  const delimiter = detectDelimiter(firstLine);

  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];

    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      record.push(field);
      field = "";
    } else if (c === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (c === "\r") {
      // hopp over – håndteres av \n
    } else {
      field += c;
    }
  }
  // Siste felt/rad
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  // Fjern helt tomme rader
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [], delimiter };

  const headers = nonEmpty[0].map((h) => h.trim());
  const rows = nonEmpty.slice(1);
  return { headers, rows, delimiter };
}

// Mål-felter i import + nøkkelord for auto-gjenkjenning av kolonner.
export const IMPORT_FIELDS = [
  { key: "email", label: "E-post", required: true, aliases: ["e-post", "epost", "email", "e-postadresse", "mail", "e post"] },
  { key: "fullName", label: "Fullt navn", required: true, aliases: ["navn", "fullt navn", "fullname", "name", "ansatt", "fornavn etternavn"] },
  { key: "title", label: "Stilling", required: false, aliases: ["stilling", "tittel", "title", "rolle/stilling"] },
  { key: "phone", label: "Telefon", required: false, aliases: ["telefon", "tlf", "mobil", "phone", "mobile", "mobilnummer"] },
  { key: "departmentName", label: "Avdeling", required: false, aliases: ["avdeling", "department", "seksjon", "team"] },
  { key: "role", label: "Rolle (tilgang)", required: false, aliases: ["rolle", "role", "tilgang", "tilgangsnivå"] },
  { key: "dateOfBirth", label: "Fødselsdato", required: false, aliases: ["fødselsdato", "fodselsdato", "født", "birthdate", "dob", "bursdag"] },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export function autoMap(headers: string[]): Record<ImportFieldKey, number> {
  const map = {} as Record<ImportFieldKey, number>;
  for (const field of IMPORT_FIELDS) {
    const idx = headers.findIndex((h) => {
      const norm = h.trim().toLowerCase();
      return field.aliases.some((a) => norm === a || norm.includes(a));
    });
    map[field.key] = idx; // -1 hvis ikke funnet
  }
  return map;
}

// Normaliser en rolle-streng fra CSV til en gyldig Role-enum.
export function normalizeRole(raw: string | undefined): "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE" | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (["admin", "administrator"].includes(v)) return "ADMIN";
  if (["hr", "personal"].includes(v)) return "HR";
  if (["manager", "leder", "avdelingsleder"].includes(v)) return "MANAGER";
  if (["employee", "ansatt", "medarbeider"].includes(v)) return "EMPLOYEE";
  return undefined;
}
