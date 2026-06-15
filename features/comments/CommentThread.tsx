"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityType = "INCIDENT" | "ACTION" | "RISK_ASSESSMENT";
type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

interface Props {
  entityType: EntityType;
  entityId: string;
  currentProfileId: string;
  role: Role;
}

export function CommentThread({ entityType, entityId, currentProfileId, role }: Props) {
  const isPrivileged = role === "ADMIN" || role === "HR" || role === "MANAGER";
  const isHrAdmin = role === "ADMIN" || role === "HR";

  const { data: comments, refetch } = trpc.comment.list.useQuery({ entityType, entityId });

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const create = trpc.comment.create.useMutation({ onSuccess: () => { setBody(""); refetch(); } });
  const update = trpc.comment.update.useMutation({ onSuccess: () => { setEditingId(null); refetch(); } });
  const del = trpc.comment.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Kommentarer ({comments?.length ?? 0})</h3>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {comments?.map((c) => (
          <div key={c.id} className={cn(
            "rounded-lg border px-3 py-2.5 space-y-1",
            c.isInternal && "border-amber-200 bg-amber-50/40 dark:bg-amber-950/10"
          )}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{c.author.fullName}</span>
                {c.author.title && <span className="text-xs text-muted-foreground">{c.author.title}</span>}
                {c.isInternal && <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">Intern</Badge>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(c.createdAt), "d. MMM HH:mm", { locale: nb })}
                  {c.editedAt && " (redigert)"}
                </span>
                {(c.author.id === currentProfileId || isHrAdmin) && editingId !== c.id && (
                  <>
                    <button onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                      className="p-1 rounded hover:bg-muted transition-colors">
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => del.mutate(c.id)}
                      className="p-1 rounded hover:bg-muted transition-colors">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === c.id ? (
              <div className="space-y-2 mt-1">
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" disabled={update.isPending}
                    onClick={() => update.mutate({ id: c.id, body: editBody })}>
                    {update.isPending ? "..." : "Lagre"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Avbryt</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-line">{c.body}</p>
            )}
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-sm text-muted-foreground">Ingen kommentarer ennå.</p>
        )}
      </div>

      {/* New comment form */}
      <div className="space-y-2">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder="Skriv en kommentar..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {isPrivileged && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
              Intern kommentar (ikke synlig for ansatt)
            </label>
          )}
          <Button size="sm" disabled={create.isPending || !body.trim()}
            onClick={() => create.mutate({ entityType, entityId, body, isInternal })}>
            {create.isPending ? "Poster..." : "Post kommentar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
