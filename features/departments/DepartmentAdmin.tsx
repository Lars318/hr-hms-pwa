"use client";

import { type FormEvent, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2, Pencil, Trash2, Plus, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DepartmentEmployees } from "./DepartmentEmployees";

interface SimpleLocation { id: string; name: string; }

export function DepartmentAdmin({ locations = [] }: { locations?: SimpleLocation[] }) {
  const utils = trpc.useUtils();
  const { data: departments = [], isLoading } = trpc.department.list.useQuery();

  const createMutation = trpc.department.create.useMutation({
    onSuccess: () => {
      utils.department.list.invalidate();
      setNewName("");
      setShowCreate(false);
    },
  });

  const updateMutation = trpc.department.update.useMutation({
    onSuccess: () => {
      utils.department.list.invalidate();
      setEditId(null);
    },
  });

  const deleteMutation = trpc.department.delete.useMutation({
    onSuccess: () => utils.department.list.invalidate(),
    onError: (err) => setDeleteError(err.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocationId, setEditLocationId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function startEdit(id: string, currentName: string, currentLocationId: string | null) {
    setEditId(id);
    setEditName(currentName);
    setEditLocationId(currentLocationId ?? "");
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (newName.trim()) createMutation.mutate({ name: newName.trim() });
  }

  function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (editId && editName.trim()) updateMutation.mutate({ id: editId, name: editName.trim(), locationId: editLocationId || null });
  }

  if (isLoading) {
    return <TableSkeleton rows={3} cols={3} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{departments.length} avdelinger</p>
        {!showCreate && departments.length > 0 && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ny avdeling
          </Button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex items-end gap-2 rounded-md border p-4 bg-muted/30">
          <div className="flex-1 space-y-1">
            <Label htmlFor="new-dept">Avdelingsnavn *</Label>
            <Input
              id="new-dept"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="f.eks. Økonomi"
            />
            {createMutation.error && (
              <p className="text-xs text-destructive">{createMutation.error.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={createMutation.isPending || !newName.trim()}>
            <Check className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); }}>
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}

      {departments.length === 0 && !showCreate ? (
        <EmptyState
          icon={Building2}
          title="Ingen avdelinger"
          description="Opprett den første avdelingen."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ny avdeling
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border divide-y">
          {departments.map((dept) => (
            <div key={dept.id}>
            <div className="flex items-center gap-3 px-4 py-3">
              {editId === dept.id ? (
                <form onSubmit={handleUpdate} className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 flex-1"
                      placeholder="Avdelingsnavn"
                    />
                    <select
                      value={editLocationId}
                      onChange={(e) => setEditLocationId(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm flex-1"
                    >
                      <option value="">Ingen lokasjon</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedId((id) => (id === dept.id ? null : dept.id))}
                    className="flex flex-1 items-center gap-3 min-w-0 text-left"
                    aria-expanded={expandedId === dept.id}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{dept.name}</p>
                      {dept.location && <p className="text-xs text-muted-foreground">{dept.location.name}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {dept._count.employees} ansatte
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                        expandedId === dept.id && "rotate-180"
                      )}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(dept.id, dept.name, dept.location?.id ?? null)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { setDeleteTarget(dept.id); setDeleteError(null); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {expandedId === dept.id && editId !== dept.id && (
              <DepartmentEmployees departmentId={dept.id} />
            )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}
        title="Slett avdeling"
        description={
          deleteError
            ? deleteError
            : "Er du sikker på at du vil slette denne avdelingen? Dette kan ikke angres."
        }
        confirmLabel="Slett"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ id: deleteTarget });
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
