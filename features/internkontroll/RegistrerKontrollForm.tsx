"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegistrerKontrollForm({ omradeId }: { omradeId: string }) {
  const router = useRouter();
  const [utfortDato, setUtfortDato] = useState(new Date().toISOString().slice(0, 10));
  const [godkjent, setGodkjent] = useState(true);
  const [merknad, setMerknad] = useState("");

  const registrer = trpc.internkontroll.registrerKontroll.useMutation({
    onSuccess() {
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        registrer.mutate({ omradeId, utfortDato, godkjent, merknad: merknad || undefined });
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
