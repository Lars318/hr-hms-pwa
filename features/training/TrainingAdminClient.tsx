"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { AlertTriangle, Clock, CheckCircle2, Plus, Trash2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  category: string;
}

interface Location {
  id: string;
  name: string;
}

interface Props {
  courses: Course[];
  locations: Location[];
  profiles: { id: string; fullName: string; email: string }[];
}

function TrainingAdminClientInner({ courses, locations, profiles }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [courseId, setCourseId] = useState(sp.get("courseId") ?? "");
  const [locationId, setLocationId] = useState("");
  const [filter, setFilter] = useState<"all" | "expiringSoon" | "expired">("all");

  // Register-skjema
  const [regCourseId, setRegCourseId] = useState(sp.get("courseId") ?? "");
  const [regProfileId, setRegProfileId] = useState("");
  const [regDate, setRegDate] = useState(new Date().toISOString().substring(0, 10));
  const [regNotes, setRegNotes] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const records = trpc.training.adminRecords.useQuery({
    courseId: courseId || undefined,
    locationId: locationId || undefined,
    expiringSoon: filter === "expiringSoon" ? true : undefined,
    expired: filter === "expired" ? true : undefined,
  });

  const createRecord = trpc.training.createRecord.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setRegProfileId("");
      setRegNotes("");
      setRegError(null);
      records.refetch();
    },
    onError: (e) => setRegError(e.message),
  });

  const deleteRecord = trpc.training.deleteRecord.useMutation({
    onSuccess: () => records.refetch(),
  });

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regCourseId) { setRegError("Velg kurs"); return; }
    if (!regProfileId) { setRegError("Velg ansatt"); return; }
    setRegError(null);
    createRecord.mutate({
      courseId: regCourseId,
      profileId: regProfileId,
      completedAt: new Date(regDate).toISOString(),
      notes: regNotes.trim() || undefined,
    });
  }

  const data = records.data ?? [];
  const now = new Date();

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Kurs</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle kurs</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Lokasjon</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle lokasjoner</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "expiringSoon" | "expired")}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Alle</option>
            <option value="expiringSoon">Utløper snart (30 dager)</option>
            <option value="expired">Utløpt</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setCourseId(""); setLocationId(""); setFilter("all"); }}>
          Nullstill
        </Button>
      </div>

      {/* Registrer-knapp */}
      <Button size="sm" onClick={() => setShowForm(!showForm)}>
        <Plus className="h-4 w-4 mr-1" />
        {showForm ? "Skjul skjema" : "Registrer gjennomføring"}
      </Button>

      {/* Registrer-skjema */}
      {showForm && (
        <form onSubmit={handleRegister} className="rounded-xl border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Ny gjennomføring</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs">Kurs *</label>
              <select required value={regCourseId} onChange={(e) => setRegCourseId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Velg kurs...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Ansatt *</label>
              <select required value={regProfileId} onChange={(e) => setRegProfileId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Velg ansatt...</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Dato *</label>
              <input type="date" required value={regDate} onChange={(e) => setRegDate(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Notat</label>
              <input type="text" value={regNotes} onChange={(e) => setRegNotes(e.target.value)}
                placeholder="Valgfritt..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          {regError && <p className="text-sm text-destructive">{regError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createRecord.isPending}>
              {createRecord.isPending ? "Lagrer..." : "Lagre"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setRegError(null); }}>
              Avbryt
            </Button>
          </div>
        </form>
      )}

      {/* Records-tabell */}
      {records.isLoading ? (
        <p className="text-sm text-muted-foreground">Laster...</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-muted-foreground text-sm">
          Ingen records matcher filteret.
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden">
          {data.map((r) => {
            const isExpired = r.expiresAt ? new Date(r.expiresAt) < now : false;
            const isExpiringSoon = r.expiresAt
              ? new Date(r.expiresAt) > now && new Date(r.expiresAt) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
              : false;
            return (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{r.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground">{r.course.name} · {r.course.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Fullført: {format(new Date(r.completedAt), "d. MMM yyyy", { locale: nb })}
                    {r.notes && ` · ${r.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.expiresAt ? (
                    <span className={`text-xs flex items-center gap-1 ${isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : "text-green-600"}`}>
                      {isExpired
                        ? <><AlertTriangle className="h-3 w-3" />Utløpt</>
                        : isExpiringSoon
                        ? <><Clock className="h-3 w-3" />{format(new Date(r.expiresAt), "d. MMM yy", { locale: nb })}</>
                        : <><CheckCircle2 className="h-3 w-3" />{format(new Date(r.expiresAt), "d. MMM yy", { locale: nb })}</>
                      }
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />Ingen utløp
                    </span>
                  )}
                  <button
                    onClick={() => { if (confirm("Slett denne gjennomføringen?")) deleteRecord.mutate({ id: r.id }); }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    aria-label="Slett"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{data.length} records vist</p>
    </div>
  );
}

export function TrainingAdminClient(props: Props) {
  return (
    <Suspense>
      <TrainingAdminClientInner {...props} />
    </Suspense>
  );
}
