"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "ACCESS",        label: "Innsyn (art. 15)",          desc: "Få vite hvilke personopplysninger vi har om deg" },
  { value: "PORTABILITY",   label: "Dataportabilitet (art. 20)", desc: "Motta dine data i et maskinlesbart format" },
  { value: "RECTIFICATION", label: "Retting (art. 16)",          desc: "Be om retting av uriktige personopplysninger" },
  { value: "ERASURE",       label: "Sletting (art. 17)",         desc: "Be om sletting av dine personopplysninger" },
  { value: "OTHER",         label: "Annet",                      desc: "Annen henvendelse om personvern" },
] as const;

export function NewDataRequestForm() {
  const router = useRouter();
  const [type, setType] = useState<typeof TYPES[number]["value"]>("ACCESS");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = trpc.dataRequest.create.useMutation({
    onSuccess: () => { setDone(true); router.refresh(); },
    onError: (e) => setError(e.message),
  });

  if (done) {
    return (
      <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
        Forespørselen er sendt. HR vil behandle den innen 30 dager og kontakte deg.
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setError(null); create.mutate({ type, message: message.trim() || undefined }); }}
      className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Type forespørsel *</label>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Tilleggsmelding (valgfri)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Beskriv eventuelt hva du ønsker mer spesifikt..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={create.isPending}>
        {create.isPending ? "Sender..." : "Send forespørsel"}
      </Button>
    </form>
  );
}
