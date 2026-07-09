"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { MapPin, Plus, X, Star } from "lucide-react";

interface AssignmentManagerProps {
  profileId: string;
}

export function AssignmentManager({ profileId }: AssignmentManagerProps) {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();
  const [adding, setAdding] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: assignments = [] } = trpc.profileAssignment.listByProfile.useQuery({ profileId });
  const { data: locations = [] } = trpc.location.list.useQuery(undefined, { staleTime: 300_000 });

  const createMutation = trpc.profileAssignment.create.useMutation({
    onSuccess: () => {
      utils.profileAssignment.listByProfile.invalidate({ profileId });
      success("Lokasjon lagt til");
      setAdding(false);
      setSelectedLocation("");
      setIsPrimary(false);
    },
    onError: (err) => toastError(err.message),
  });

  const removeMutation = trpc.profileAssignment.endAssignment.useMutation({
    onSuccess: () => {
      utils.profileAssignment.listByProfile.invalidate({ profileId });
      success("Lokasjon fjernet");
    },
    onError: (err) => toastError(err.message),
  });

  const setPrimaryMutation = trpc.profileAssignment.setPrimary.useMutation({
    onSuccess: () => {
      utils.profileAssignment.listByProfile.invalidate({ profileId });
      success("Primærlokasjon oppdatert");
    },
    onError: (err) => toastError(err.message),
  });

  const active = assignments.filter((a) => !a.endDate);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Lokasjoner</p>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)} className="h-8 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Legg til
        </Button>
      </div>

      {active.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">Ingen lokasjoner tilknyttet.</p>
      )}

      <div className="space-y-2">
        {active.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {a.location.name}{a.location.city ? `, ${a.location.city}` : ""}
              </p>
              {a.isPrimary && <p className="text-xs text-primary">Primær</p>}
            </div>
            {!a.isPrimary && (
              <button
                onClick={() => setPrimaryMutation.mutate({ id: a.id, profileId })}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Sett som primær"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => removeMutation.mutate({ id: a.id })}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Fjern"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="rounded-2xl border bg-card p-3 space-y-3">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Velg lokasjon…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}{l.city ? `, ${l.city}` : ""}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded"
            />
            Primærlokasjon
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!selectedLocation || createMutation.isPending}
              onClick={() => createMutation.mutate({ profileId, locationId: selectedLocation, isPrimary, startDate: new Date() })}
              className="flex-1"
            >
              {createMutation.isPending ? "Lagrer…" : "Legg til"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Avbryt</Button>
          </div>
        </div>
      )}
    </div>
  );
}
