"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { WbStatusBadge, WbSeverityBadge, WbCategoryLabel } from "./WbBadges";
import { Lock, MessageSquare, ClipboardList, UserCheck } from "lucide-react";
import type { WhistleblowingStatus } from "@prisma/client";

const STATUSES: { value: WhistleblowingStatus; label: string }[] = [
  { value: "RECEIVED", label: "Mottatt" },
  { value: "UNDER_REVIEW", label: "Under vurdering" },
  { value: "INVESTIGATING", label: "Undersøkes" },
  { value: "ACTION_REQUIRED", label: "Tiltak kreves" },
  { value: "CLOSED", label: "Lukket" },
  { value: "REJECTED", label: "Avvist" },
];

interface Props {
  caseId: string;
  viewerRole: string;
  viewerId: string;
  assignableProfiles: { id: string; fullName: string }[];
}

export function CaseDetailClient({ caseId, viewerRole, viewerId, assignableProfiles }: Props) {
  const isHrAdmin = viewerRole === "HR" || viewerRole === "ADMIN";
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.whistleblowing.byId.useQuery({ id: caseId });

  const [newMessage, setNewMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WhistleblowingStatus | "">("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);

  const addMessage = trpc.whistleblowing.addMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      setIsInternalNote(false);
      utils.whistleblowing.byId.invalidate({ id: caseId });
    },
    onError: (e) => setActionError(e.message),
  });

  const updateStatus = trpc.whistleblowing.updateStatus.useMutation({
    onSuccess: () => {
      setSelectedStatus("");
      utils.whistleblowing.byId.invalidate({ id: caseId });
    },
    onError: (e) => setActionError(e.message),
  });

  const assign = trpc.whistleblowing.assign.useMutation({
    onSuccess: () => {
      setSelectedAssignee("");
      utils.whistleblowing.byId.invalidate({ id: caseId });
    },
    onError: (e) => setActionError(e.message),
  });

  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Laster sak…</div>;
  if (error || !data) return <div className="py-16 text-center text-sm text-destructive">Fant ikke saken eller ingen tilgang.</div>;

  const c = data;
  const canSendMessage =
    isHrAdmin ||
    viewerRole === "MANAGER" ||
    (viewerRole === "EMPLOYEE" && !c.isAnonymous && c.reporterId === viewerId);

  return (
    <div className="space-y-6">
      {/* Konfidensialitets-banner */}
      {c.isConfidential && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Konfidensiell varslingssak – behandles strengt fortrolig.</span>
        </div>
      )}

      {/* Sakshode */}
      <div className="rounded-xl border p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{c.caseNumber}</p>
            <h2 className="text-lg font-semibold">{c.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <WbStatusBadge status={c.status} />
            <WbSeverityBadge severity={c.severity} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Kategori</p>
            <p><WbCategoryLabel category={c.category} /></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mottatt</p>
            <p>{new Date(c.receivedAt).toLocaleDateString("nb-NO")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Varsler</p>
            <p>{c.isAnonymous ? "Anonym" : (c.reporter?.fullName ?? "Ukjent")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saksbehandler</p>
            <p>{c.assignedTo?.fullName ?? "Ikke tildelt"}</p>
          </div>
          {c.location && (
            <div>
              <p className="text-xs text-muted-foreground">Lokasjon</p>
              <p>{c.location.name}</p>
            </div>
          )}
          {c.department && (
            <div>
              <p className="text-xs text-muted-foreground">Avdeling</p>
              <p>{c.department.name}</p>
            </div>
          )}
        </div>
        {isHrAdmin && (
          <div className="mt-2 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Beskrivelse</p>
            <p className="text-sm whitespace-pre-wrap">{c.description}</p>
          </div>
        )}
        {!isHrAdmin && viewerRole === "EMPLOYEE" && (
          <div className="mt-2 border-t pt-3">
            <p className="text-sm text-muted-foreground italic">
              Beskrivelsen er kun synlig for HR og administrator under behandling.
            </p>
          </div>
        )}
      </div>

      {/* HR-handlinger */}
      {isHrAdmin && (
        <div className="rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Sakshandlinger
          </h3>

          {actionError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Endre status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Endre status</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px]"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as WhistleblowingStatus)}
                >
                  <option value="">Velg ny status…</option>
                  {STATUSES.filter((s) => s.value !== c.status).map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="min-h-[44px]"
                  disabled={!selectedStatus || updateStatus.isPending}
                  onClick={() => {
                    if (selectedStatus) updateStatus.mutate({ id: caseId, status: selectedStatus });
                  }}
                >
                  Lagre
                </Button>
              </div>
            </div>

            {/* Tildel saksbehandler */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tildel saksbehandler</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm min-h-[44px]"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  <option value="">Velg saksbehandler…</option>
                  <option value="__clear__">Fjern tildeling</option>
                  {assignableProfiles.map(({ id, fullName }) => (
                    <option key={id} value={id}>{fullName}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="min-h-[44px]"
                  disabled={!selectedAssignee || assign.isPending}
                  onClick={() => {
                    if (selectedAssignee) {
                      assign.mutate({
                        id: caseId,
                        assignedToId: selectedAssignee === "__clear__" ? null : selectedAssignee,
                      });
                    }
                  }}
                >
                  Sett
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meldinger */}
      <div className="rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Meldinger
        </h3>

        {c.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen meldinger ennå.</p>
        ) : (
          <div className="space-y-3">
            {c.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-4 py-3 text-sm ${
                  m.isInternalNote
                    ? "border border-amber-200 bg-amber-50"
                    : "bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {m.author?.fullName ?? "Anonym"}{" "}
                    {m.isInternalNote && <span className="text-amber-600 font-medium">(Intern notat)</span>}
                  </span>
                  <span>{new Date(m.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
        )}

        {canSendMessage && (
          <div className="space-y-2 border-t pt-4">
            <textarea
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder={isHrAdmin ? "Skriv melding eller notat…" : "Skriv melding til saksbehandler…"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            {isHrAdmin && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                />
                Intern notat (skjult for varsler)
              </label>
            )}
            <Button
              size="sm"
              disabled={!newMessage.trim() || addMessage.isPending}
              onClick={() => addMessage.mutate({ caseId, body: newMessage.trim(), isInternalNote })}
            >
              {addMessage.isPending ? "Sender…" : "Send"}
            </Button>
          </div>
        )}
      </div>

      {/* Audit-logg – kun HR/ADMIN */}
      {isHrAdmin && c.auditLogs.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Hendelseslogg
          </h3>
          <div className="space-y-2">
            {c.auditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <span className="font-mono text-xs bg-muted rounded px-1">{log.action}</span>
                  {" "}
                  <span className="text-muted-foreground">{log.actor?.fullName ?? "System"}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
