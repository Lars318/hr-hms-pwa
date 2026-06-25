"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fagmodulForKategori, type SjekkpunktResultat } from "./sjekklister";

export function RegistrerKontrollForm({
  omradeId,
  kategori,
}: {
  omradeId: string;
  kategori?: string;
}) {
  const router = useRouter();
  const fagmodul = kategori ? fagmodulForKategori(kategori) : undefined;

  const [utfortDato, setUtfortDato] = useState(new Date().toISOString().slice(0, 10));
  const [godkjent, setGodkjent] = useState(true);
  const [merknad, setMerknad] = useState("");

  // Sjekkliste-tilstand: standard OK, kan slås til avvik + egen merknad.
  const [punkter, setPunkter] = useState<SjekkpunktResultat[]>(
    () => fagmodul?.punkter.map((p) => ({ id: p.id, label: p.label, ok: true })) ?? []
  );

  const registrer = trpc.internkontroll.registrerKontroll.useMutation({
    onSuccess() {
      router.refresh();
    },
  });

  function settPunkt(id: string, ok: boolean) {
    setPunkter((prev) => prev.map((p) => (p.id === id ? { ...p, ok } : p)));
  }
  function settPunktMerknad(id: string, m: string) {
    setPunkter((prev) => prev.map((p) => (p.id === id ? { ...p, merknad: m || undefined } : p)));
  }

  const alleOk = punkter.every((p) => p.ok);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        registrer.mutate({
          omradeId,
          utfortDato,
          godkjent: fagmodul ? alleOk : godkjent,
          merknad: merknad || undefined,
          sjekkpunkter: fagmodul ? punkter : undefined,
        });
      }}
      className="rounded-2xl border bg-card p-5 space-y-4"
    >
      <h2 className="font-semibold">Registrer kontroll</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Dato utført</label>
        <input
          type="date"
          value={utfortDato}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setUtfortDato(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {fagmodul ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Sjekkliste – {fagmodul.navn}</label>
          <div className="rounded-xl border divide-y">
            {fagmodul.punkter.map((mal) => {
              const res = punkter.find((p) => p.id === mal.id)!;
              return (
                <div key={mal.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{mal.label}</p>
                      {mal.hjelp && (
                        <p className="text-xs text-muted-foreground mt-0.5">{mal.hjelp}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => settPunkt(mal.id, true)}
                        aria-label="OK"
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg border transition-colors",
                          res.ok ? "bg-green-100 text-green-700 border-green-300" : "border-border text-muted-foreground"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => settPunkt(mal.id, false)}
                        aria-label="Avvik"
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg border transition-colors",
                          !res.ok ? "bg-red-100 text-red-700 border-red-300" : "border-border text-muted-foreground"
                        )}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {!res.ok && (
                    <input
                      type="text"
                      value={res.merknad ?? ""}
                      onChange={(e) => settPunktMerknad(mal.id, e.target.value)}
                      placeholder="Beskriv avviket…"
                      className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium w-fit",
              alleOk ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"
            )}
          >
            {alleOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {alleOk ? "Alt godkjent" : `${punkter.filter((p) => !p.ok).length} avvik`}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-sm font-medium">Resultat</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGodkjent(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                godkjent ? "bg-green-100 text-green-700 border-green-300" : "border-border text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Godkjent
            </button>
            <button
              type="button"
              onClick={() => setGodkjent(false)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                !godkjent ? "bg-red-100 text-red-700 border-red-300" : "border-border text-muted-foreground"
              }`}
            >
              <XCircle className="h-3.5 w-3.5" /> Avvik funnet
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Merknad (valgfritt)</label>
        <textarea
          value={merknad}
          onChange={(e) => setMerknad(e.target.value)}
          rows={3}
          placeholder="Beskriv funn, tiltak eller kommentarer…"
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <Button type="submit" disabled={registrer.isPending} className="w-full">
        {registrer.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Registrer
      </Button>
    </form>
  );
}
