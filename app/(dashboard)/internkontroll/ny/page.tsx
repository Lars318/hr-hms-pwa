"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const KATEGORIER = [
  { value: "BRANNVERN",     label: "🔥 Brannvern",      tip: "Brannøvelse, slokkeutstyr, rømningsveier" },
  { value: "EL_SIKKERHET",  label: "⚡ El-sikkerhet",   tip: "Periodisk el-kontroll (FEL-forskriften)" },
  { value: "ARBEIDSMILJO",  label: "👷 Arbeidsmiljø",   tip: "Vernerunde, ergonomi, støy" },
  { value: "KJORETOY",      label: "🚗 Kjøretøy",       tip: "Service og sikkerhetskontroll" },
  { value: "STOFFKARTOTEK", label: "🧪 Stoffkartotek",  tip: "Kjemikaliegjennomgang og opplæring" },
  { value: "ANNET",         label: "📋 Annet",           tip: "Andre lovpålagte kontroller" },
];

const INTERVALLER = [
  { dager: 30,  label: "Månedlig" },
  { dager: 90,  label: "Kvartalsvis" },
  { dager: 180, label: "Halvårlig" },
  { dager: 365, label: "Årlig" },
  { dager: 730, label: "Hvert 2. år" },
];

export default function NyttOmradePage() {
  const router = useRouter();
  const [kategori, setKategori] = useState("BRANNVERN");
  const [tittel, setTittel] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [intervalDager, setIntervalDager] = useState(365);

  const opprett = trpc.internkontroll.opprettOmrade.useMutation({
    onSuccess(data) {
      router.push(`/internkontroll/${data.id}`);
    },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/internkontroll" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nytt kontrollområde</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!tittel.trim()) return;
          opprett.mutate({ kategori: kategori as never, tittel, beskrivelse: beskrivelse || undefined, intervalDager });
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <div className="grid grid-cols-2 gap-2">
            {KATEGORIER.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => { setKategori(k.value); if (!tittel) setTittel(k.label.split(" ").slice(1).join(" ")); }}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  kategori === k.value ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-medium">{k.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.tip}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tittel</label>
          <input
            type="text"
            value={tittel}
            onChange={(e) => setTittel(e.target.value)}
            placeholder="F.eks. Brannøvelse, El-kontroll bygg A"
            required
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Beskrivelse (valgfritt)</label>
          <textarea
            value={beskrivelse}
            onChange={(e) => setBeskrivelse(e.target.value)}
            rows={2}
            placeholder="Hva skal kontrolleres?"
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kontrollintervall</label>
          <div className="flex flex-wrap gap-2">
            {INTERVALLER.map((i) => (
              <button
                key={i.dager}
                type="button"
                onClick={() => setIntervalDager(i.dager)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  intervalDager === i.dager ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={opprett.isPending || !tittel.trim()} className="w-full">
          {opprett.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Opprett kontrollområde
        </Button>
      </form>
    </div>
  );
}
