"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check } from "lucide-react";
import type { Department, Location } from "@prisma/client";

interface Props {
  selectedIds: string[];
  departments: Department[];
  locations: Location[];
  onDone: () => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, departments, locations, onDone, onClear }: Props) {
  const utils = trpc.useUtils();
  const [departmentId, setDepartmentId] = useState("");
  const [addDepartmentId, setAddDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const bulk = trpc.profile.bulkUpdate.useMutation({
    onSuccess: () => {
      utils.profile.list.invalidate();
      utils.department.list.invalidate();
      reset();
      onDone();
    },
  });

  function reset() {
    setDepartmentId(""); setAddDepartmentId(""); setLocationId(""); setRole(""); setStatus("");
  }

  const hasChange = departmentId || addDepartmentId || locationId || role || status;

  function apply() {
    if (!hasChange) return;
    bulk.mutate({
      ids: selectedIds,
      departmentId: departmentId || undefined,
      addDepartmentId: addDepartmentId || undefined,
      locationId: locationId || undefined,
      role: (role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") || undefined,
      status: (status as "ACTIVE" | "INACTIVE") || undefined,
    });
  }

  const selectClass =
    "h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="sticky top-2 z-20 rounded-2xl border bg-card shadow-sm p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{selectedIds.length} valgt</span>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground" aria-label="Fjern valg">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={selectClass}>
          <option value="">Sett avdeling …</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select value={addDepartmentId} onChange={(e) => setAddDepartmentId(e.target.value)} className={selectClass}>
          <option value="">+ Tilleggsavdeling …</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={selectClass}>
          <option value="">Sett lokasjon …</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          <option value="">Sett rolle …</option>
          <option value="EMPLOYEE">Ansatt</option>
          <option value="MANAGER">Leder</option>
          <option value="HR">HR</option>
          <option value="ADMIN">Administrator</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Sett status …</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Inaktiv</option>
        </select>

        <Button size="sm" onClick={apply} disabled={!hasChange || bulk.isPending} className="h-9">
          {bulk.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Bruk på {selectedIds.length}
        </Button>
      </div>

      {bulk.error && <p className="text-sm text-destructive">{bulk.error.message}</p>}
    </div>
  );
}
