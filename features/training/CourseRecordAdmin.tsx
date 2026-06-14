"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  courseId: string;
  courseName: string;
}

export function CourseRecordAdmin({ courseId, courseName }: Props) {
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const profiles = trpc.profile.list.useQuery({}, { staleTime: 60_000 });

  const create = trpc.training.createRecord.useMutation({
    onSuccess: () => {
      setOpen(false);
      setProfileId("");
      setNotes("");
      setError(null);
    },
    onError: (e) => setError(e.message),
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Registrer gjennomføring
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) { setError("Velg ansatt"); return; }
    setError(null);
    create.mutate({
      courseId,
      profileId,
      completedAt: new Date(completedAt).toISOString(),
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <h3 className="text-sm font-semibold">Registrer gjennomføring – {courseName}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm">Ansatt *</label>
          <select
            required
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Velg ansatt...</option>
            {profiles.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName} — {p.email}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Gjennomføringsdato *</label>
          <input
            required
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Notat (valgfritt)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="f.eks. eksternt kurs, kursnummer..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? "Lagrer..." : "Lagre"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(false); setError(null); }}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
