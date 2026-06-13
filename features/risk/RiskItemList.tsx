"use client";

import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RiskLevelBadge } from "./RiskLevelBadge";
import { RiskItemForm } from "./RiskItemForm";
import { ActionForm } from "./ActionForm";
import { ActionStatusBadge } from "@/features/actions/ActionStatusBadge";
import { ActionPriorityBadge } from "@/features/actions/ActionPriorityBadge";
import { RISK_ITEM_STATUS_LABELS } from "@/lib/risk";
import type { Profile, Role } from "@prisma/client";

interface RiskItem {
  id: string;
  hazard: string;
  consequence: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  existingMeasures: string | null;
  proposedMeasures: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  dueDate: Date | null;
  responsible: { id: string; fullName: string } | null;
  actions: {
    id: string;
    title: string;
    status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dueDate: Date | null;
    assignedTo: { id: string; fullName: string } | null;
  }[];
}

interface RiskItemListProps {
  assessmentId: string;
  items: RiskItem[];
  canManage: boolean;
  employees: Pick<Profile, "id" | "fullName">[];
  viewerRole: Role;
}

export function RiskItemList({ assessmentId, items, canManage, employees, viewerRole }: RiskItemListProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [addActionFor, setAddActionFor] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const deleteItemMutation = trpc.riskItem.delete.useMutation({
    onSuccess: () => utils.riskAssessment.byId.invalidate({ id: assessmentId }),
  });

  const updateStatusMutation = trpc.riskItem.update.useMutation({
    onSuccess: () => utils.riskAssessment.byId.invalidate({ id: assessmentId }),
  });

  function toggleExpand(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && !showAddItem && (
        <p className="text-sm text-muted-foreground py-4">Ingen risikopunkter lagt til ennå.</p>
      )}

      {items.map((item) => {
        const isExpanded = expandedItems.has(item.id);
        return (
          <div key={item.id} className="rounded-md border">
            {/* Header row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className="flex-1 font-medium text-sm line-clamp-1">{item.hazard}</span>
              <RiskLevelBadge level={item.riskLevel} />
              <span className="text-xs text-muted-foreground">{item.riskScore}</span>
              <Badge variant="outline" className="text-xs hidden md:inline-flex">{RISK_ITEM_STATUS_LABELS[item.status]}</Badge>
              {item.actions.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />{item.actions.length}
                </span>
              )}
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div className="border-t px-4 py-4 space-y-4">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Konsekvens</dt>
                    <dd className="mt-0.5">{item.consequence}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Score</dt>
                    <dd className="mt-0.5">{item.likelihood} × {item.impact} = <strong>{item.riskScore}</strong></dd>
                  </div>
                  {item.existingMeasures && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Eksisterende tiltak</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">{item.existingMeasures}</dd>
                    </div>
                  )}
                  {item.proposedMeasures && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Foreslåtte tiltak</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">{item.proposedMeasures}</dd>
                    </div>
                  )}
                  {item.responsible && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Ansvarlig</dt>
                      <dd className="mt-0.5">{item.responsible.fullName}</dd>
                    </div>
                  )}
                  {item.dueDate && (
                    <div>
                      <dt className="text-muted-foreground text-xs">Frist</dt>
                      <dd className="mt-0.5">{format(new Date(item.dueDate), "d. MMMM yyyy", { locale: nb })}</dd>
                    </div>
                  )}
                </dl>

                {/* Actions under this item */}
                {item.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tiltak</p>
                    <div className="rounded-md border divide-y">
                      {item.actions.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="flex-1 font-medium">{a.title}</span>
                          <ActionPriorityBadge priority={a.priority} />
                          <ActionStatusBadge status={a.status} />
                          {a.assignedTo && <span className="text-xs text-muted-foreground hidden md:block">{a.assignedTo.fullName}</span>}
                          {a.dueDate && <span className="text-xs text-muted-foreground hidden lg:block">{format(new Date(a.dueDate), "d. MMM", { locale: nb })}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add action form */}
                {addActionFor === item.id && (
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="text-sm font-medium mb-3">Nytt tiltak</p>
                    <ActionForm
                      riskItemId={item.id}
                      assessmentId={assessmentId}
                      employees={employees}
                      onSuccess={() => setAddActionFor(null)}
                      onCancel={() => setAddActionFor(null)}
                    />
                  </div>
                )}

                {/* Actions row */}
                {canManage && (
                  <div className="flex gap-2 flex-wrap">
                    {addActionFor !== item.id && (
                      <Button size="sm" variant="outline" onClick={() => setAddActionFor(item.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Nytt tiltak
                      </Button>
                    )}
                    {item.status !== "RESOLVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: item.status === "OPEN" ? "IN_PROGRESS" : "RESOLVED" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        {item.status === "OPEN" ? "Sett til pågår" : "Merk løst"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Slett risikopunkt?")) deleteItemMutation.mutate({ id: item.id }); }}
                    >
                      Slett
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add risk item */}
      {canManage && (
        showAddItem ? (
          <div className="rounded-md border bg-muted/20 p-4 space-y-3">
            <p className="font-medium text-sm">Nytt risikopunkt</p>
            <RiskItemForm
              assessmentId={assessmentId}
              employees={employees}
              onSuccess={() => setShowAddItem(false)}
              onCancel={() => setShowAddItem(false)}
            />
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4 mr-2" /> Legg til risikopunkt
          </Button>
        )
      )}
    </div>
  );
}
