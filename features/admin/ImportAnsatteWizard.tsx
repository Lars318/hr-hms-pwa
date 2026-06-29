"use client";

import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseCsv, autoMap, normalizeRole, IMPORT_FIELDS,
  type ImportFieldKey,
} from "@/lib/csv/parseCsv";

interface ImportRow {
  email: string;
  fullName: string;
  title?: string | null;
  phone?: string | null;
  departmentName?: string | null;
  role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
  dateOfBirth?: string | null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function ImportAnsatteWizard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, number>>();
  const [fileName, setFileName] = useState<string>();
  const [parseError, setParseError] = useState<string | null>(null);

  const importMut = trpc.profile.bulkImport.useMutation();
  const utils = trpc.useUtils();

  function handleFile(file: File) {
    setParseError(null);
    importMut.reset();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers, rows } = parseCsv(String(reader.result ?? ""));
        if (headers.length === 0 || rows.length === 0) {
          setParseError("Fant ingen rader i fila.");
          return;
        }
        setHeaders(headers);
        setRows(rows);
        setMapping(autoMap(headers));
        setFileName(file.name);
      } catch {
        setParseError("Kunne ikke lese CSV-fila.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // Bygg importrader fra mapping.
  const built = useMemo<{ valid: ImportRow[]; invalid: { rad: number; grunn: string }[] }>(() => {
    if (!mapping) return { valid: [], invalid: [] };
    const valid: ImportRow[] = [];
    const invalid: { rad: number; grunn: string }[] = [];
    const seen = new Set<string>();

    const get = (r: string[], key: ImportFieldKey) => {
      const idx = mapping[key];
      return idx >= 0 ? (r[idx] ?? "").trim() : "";
    };

    rows.forEach((r, i) => {
      const email = get(r, "email").toLowerCase();
      const fullName = get(r, "fullName");
      if (!email && !fullName) return; // tom rad
      if (!EMAIL_RE.test(email)) {
        invalid.push({ rad: i + 2, grunn: "Ugyldig/manglende e-post" });
        return;
      }
      if (fullName.length < 2) {
        invalid.push({ rad: i + 2, grunn: "Mangler navn" });
        return;
      }
      if (seen.has(email)) {
        invalid.push({ rad: i + 2, grunn: "Duplikat e-post i fila" });
        return;
      }
      seen.add(email);
      valid.push({
        email,
        fullName,
        title: get(r, "title") || null,
        phone: get(r, "phone") || null,
        departmentName: get(r, "departmentName") || null,
        role: normalizeRole(get(r, "role")),
        dateOfBirth: get(r, "dateOfBirth") || null,
      });
    });
    return { valid, invalid };
  }, [rows, mapping]);

  function runImport() {
    if (built.valid.length === 0) return;
    importMut.mutate(
      { rows: built.valid },
      { onSuccess: () => utils.profile.list.invalidate() }
    );
  }

  // ── Steg 1: last opp ──────────────────────────────────────────────────────
  if (headers.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">Last opp CSV-fil med ansatte</p>
          <p className="text-sm text-muted-foreground mt-1">
            Eksporter ansattlisten fra Tripletex til CSV/Excel og last den opp her.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" /> Velg fil
        </Button>
        {parseError && <p className="text-sm text-destructive">{parseError}</p>}
        <p className="text-xs text-muted-foreground">
          Forventede kolonner: e-post og navn (påkrevd) · stilling, telefon, avdeling, rolle, fødselsdato (valgfritt)
        </p>
      </div>
    );
  }

  // ── Steg 3: resultat ──────────────────────────────────────────────────────
  if (importMut.data) {
    const { summary, results } = importMut.data;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Opprettet", value: summary.created, cls: "text-green-600 bg-green-50 border-green-200" },
            { label: "Hoppet over", value: summary.skipped, cls: "text-muted-foreground bg-muted/30 border-border" },
            { label: "Feil", value: summary.errors, cls: "text-red-600 bg-red-50 border-red-200" },
          ].map((c) => (
            <div key={c.label} className={cn("rounded-xl border p-4 text-center", c.cls)}>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {(summary.skipped > 0 || summary.errors > 0) && (
          <div className="rounded-xl border divide-y max-h-72 overflow-y-auto">
            {results.filter((r) => r.status !== "created").map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                {r.status === "skipped" ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <span className="font-medium">{r.email}</span>
                <span className="text-muted-foreground">— {r.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          De importerte ansatte har fått en konto, men <strong>ikke passord</strong>. De setter
          eget passord ved å bruke «Glemt passord» på innloggingssiden.
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setHeaders([]); setRows([]); setMapping(undefined); setFileName(undefined);
            importMut.reset();
          }}
        >
          Importer en ny fil
        </Button>
      </div>
    );
  }

  // ── Steg 2: mapping + forhåndsvisning ─────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" /> {fileName} · {rows.length} rader
      </div>

      {/* Kolonne-mapping */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Koble kolonner</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPORT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </label>
              <select
                value={mapping?.[f.key] ?? -1}
                onChange={(e) =>
                  setMapping((m) => ({ ...(m as Record<ImportFieldKey, number>), [f.key]: Number(e.target.value) }))
                }
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={-1}>– ikke importer –</option>
                {headers.map((h, idx) => (
                  <option key={idx} value={idx}>{h || `Kolonne ${idx + 1}`}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Oppsummering av validering */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 font-medium">
          <CheckCircle2 className="h-4 w-4" /> {built.valid.length} klare for import
        </span>
        {built.invalid.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 font-medium">
            <AlertTriangle className="h-4 w-4" /> {built.invalid.length} hoppes over
          </span>
        )}
      </div>

      {/* Forhåndsvisning */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">E-post</th>
              <th className="text-left px-3 py-2 font-medium">Navn</th>
              <th className="text-left px-3 py-2 font-medium">Stilling</th>
              <th className="text-left px-3 py-2 font-medium">Avdeling</th>
              <th className="text-left px-3 py-2 font-medium">Rolle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {built.valid.slice(0, 8).map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.title ?? "–"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.departmentName ?? "–"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.role ?? "EMPLOYEE"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {built.valid.length > 8 && (
          <p className="px-3 py-2 text-xs text-muted-foreground border-t">
            +{built.valid.length - 8} flere rader …
          </p>
        )}
      </div>

      {importMut.error && (
        <p className="text-sm text-destructive">{importMut.error.message}</p>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={runImport} disabled={built.valid.length === 0 || importMut.isPending}>
          {importMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Importer {built.valid.length} ansatte
        </Button>
        <Button
          variant="outline"
          onClick={() => { setHeaders([]); setRows([]); setMapping(undefined); setFileName(undefined); }}
        >
          Avbryt
        </Button>
      </div>
    </div>
  );
}
