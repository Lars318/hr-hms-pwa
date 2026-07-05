"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check, Mail } from "lucide-react";
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
  const [titleSelect, setTitleSelect] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const effectiveTitle = titleSelect === "__custom__" ? customTitle.trim() : titleSelect;

  const [inviteResult, setInviteResult] = useState<{ sent: number; errors: number } | null>(null);

  const bulk = trpc.profile.bulkUpdate.useMutation({
    onSuccess: () => {
      utils.profile.list.invalidate();
      utils.department.list.invalidate();
      reset();
      onDone();
    },
  });

  const invite = trpc.profile.invite.useMutation({
    onSuccess: (r) => {
      setInviteResult({ sent: r.sent, errors: r.errors });
      utils.profile.list.invalidate();
    },
  });

  function reset() {
    setDepartmentId(""); setAddDepartmentId(""); setLocationId(""); setRole(""); setStatus("");
    setTitleSelect(""); setCustomTitle(""); setEmploymentType("");
  }

  const hasChange = departmentId || addDepartmentId || locationId || role || status || effectiveTitle || employmentType;

  function apply() {
    if (!hasChange) return;
    bulk.mutate({
      ids: selectedIds,
      departmentId: departmentId || undefined,
      addDepartmentId: addDepartmentId || undefined,
      locationId: locationId || undefined,
      role: (role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") || undefined,
      status: (status as "ACTIVE" | "INACTIVE") || undefined,
      title: effectiveTitle || undefined,
      employmentType: (employmentType as "EMPLOYEE" | "SELF_EMPLOYED") || undefined,
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

        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={selectClass}>
          <option value="">Sett tilknytning …</option>
          <option value="EMPLOYEE">Ansatt</option>
          <option value="SELF_EMPLOYED">Selvstendig næringsdrivende</option>
        </select>

        <select value={titleSelect} onChange={(e) => setTitleSelect(e.target.value)} className={selectClass}>
          <option value="">Sett tittel …</option>
          <option value="Personlig Trener">Personlig Trener</option>
          <option value="Instruktør">Instruktør</option>
          <option value="Resepsjonist">Resepsjonist</option>
          <option value="__custom__">Egendefinert …</option>
        </select>

        {titleSelect === "__custom__" && (
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Skriv tittel"
            className="h-9 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        <Button size="sm" onClick={apply} disabled={!hasChange || bulk.isPending} className="h-9">
          {bulk.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Bruk på {selectedIds.length}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-9"
          disabled={invite.isPending}
          onClick={() => { setInviteResult(null); invite.mutate({ ids: selectedIds }); }}
        >
          {invite.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Mail className="h-4 w-4 mr-1.5" />}
          Send invitasjon
        </Button>
      </div>

      {bulk.error && <p className="text-sm text-destructive">{bulk.error.message}</p>}
      {invite.error && <p className="text-sm text-destructive">{invite.error.message}</p>}
      {inviteResult && (
        <p className="text-sm text-green-600">
          Invitasjon sendt til {inviteResult.sent}{inviteResult.errors > 0 ? ` (${inviteResult.errors} feilet)` : ""}.
        </p>
      )}
    </div>
  );
}
