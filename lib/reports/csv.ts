export function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // Wrap in quotes if contains separator, quotes, or line breaks
  if (/[;"'\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const sep = ";";
  const lines = [
    headers.map(escapeCsv).join(sep),
    ...rows.map((row) => row.map(escapeCsv).join(sep)),
  ];
  // UTF-8 BOM — Excel detects encoding correctly
  return "﻿" + lines.join("\r\n");
}
