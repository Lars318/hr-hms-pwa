"use client";

import { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Award, Plus, Trash2, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CATEGORY_LABELS: Record<string, string> = {
  FIRST_AID: "Førstehjelp",
  FIRE_SAFETY: "Brannvern",
  PT: "PT-sertifisering",
  ELECTRICAL: "El-sikkerhet",
  OTHER: "Annet",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function expiryBadge(expiresAt: Date | null) {
  if (!expiresAt) return { label: "Uten utløp", cls: "bg-muted text-muted-foreground" };
  const days = differenceInCalendarDays(new Date(expiresAt), new Date());
  if (days < 0) return { label: "Utløpt", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days} d igjen`, cls: "bg-amber-100 text-amber-700" };
  return { label: "Gyldig", cls: "bg-emerald-100 text-emerald-700" };
}

interface Props {
  profileId: string;
  canEdit: boolean;
}

export function CertificationSection({ profileId, canEdit }: Props) {
  const utils = trpc.useUtils();
  const { data: certs = [], isLoading } = trpc.certification.listForProfile.useQuery({ profileId });
  const [showForm, setShowForm] = useState(false);

  const del = trpc.certification.delete.useMutation({
    onSuccess: () => utils.certification.listForProfile.invalidate({ profileId }),
  });

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Kompetanse og sertifikater</h3>
        </div>
        {canEdit && !showForm && (
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Legg til
          </Button>
        )}
      </div>

      {canEdit && showForm && (
        <CertificationForm profileId={profileId} onClose={() => setShowForm(false)} />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : certs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen sertifikater registrert.</p>
      ) : (
        <ul className="divide-y">
          {certs.map((c) => {
            const badge = expiryBadge(c.expiresAt);
            return (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[c.category] ?? c.category}
                    {c.expiresAt ? ` · utløper ${format(new Date(c.expiresAt), "d. MMM yyyy", { locale: nb })}` : ""}
                    {c.issuer ? ` · ${c.issuer}` : ""}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", badge.cls)}>
                  {badge.label}
                </span>
                {canEdit && (
                  <button
                    onClick={() => { if (confirm(`Slette «${c.name}»?`)) del.mutate({ id: c.id }); }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Slett"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CertificationForm({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("FIRST_AID");
  const [issuer, setIssuer] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const upsert = trpc.certification.upsert.useMutation({
    onSuccess: () => {
      utils.certification.listForProfile.invalidate({ profileId });
      onClose();
    },
  });

  const inputClass = "h-9 w-full rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Nytt sertifikat</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <input className={inputClass} placeholder="Navn (f.eks. Førstehjelpskurs)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <input className={inputClass} placeholder="Utsteder (valgfritt)" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      </div>
      <label className="block text-xs text-muted-foreground">
        Utløpsdato
        <input type="date" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
      <Button
        size="sm"
        className="h-8 w-full"
        disabled={!name.trim() || upsert.isPending}
        onClick={() => upsert.mutate({
          profileId,
          name: name.trim(),
          category: category as "FIRST_AID" | "FIRE_SAFETY" | "PT" | "ELECTRICAL" | "OTHER",
          issuer: issuer.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        })}
      >
        {upsert.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
        Lagre
      </Button>
      {upsert.error && <p className="text-xs text-destructive">{upsert.error.message}</p>}
    </div>
  );
}
