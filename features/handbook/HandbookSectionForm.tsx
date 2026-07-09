"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HandbookSection } from "@prisma/client";

interface Props {
  categoryId: string;
  sections: HandbookSection[];
}

interface SectionEditorProps {
  categoryId: string;
  section?: HandbookSection;
  onDone: () => void;
}

function SectionEditor({ categoryId, section, onDone }: SectionEditorProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [content, setContent] = useState(section?.content ?? "");
  const [order, setOrder] = useState(section?.order ?? 0);
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const upsert = trpc.handbook.upsertSection.useMutation({
    onSuccess: () => {
      utils.handbook.listCategories.invalidate();
      utils.handbook.categoryById.invalidate({ id: categoryId });
      success(section ? "Seksjon oppdatert!" : "Seksjon opprettet!");
      onDone();
    },
    onError: (err) => toastError(err.message),
  });

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <div className="space-y-1">
        <Label>Tittel *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tittel på seksjonen" />
      </div>
      <div className="space-y-1">
        <Label>Innhold (Markdown støttes)</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Skriv innholdet i seksjonen her…"
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-1 max-w-[120px]">
        <Label>Rekkefølge</Label>
        <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!title.trim() || upsert.isPending}
          onClick={() => upsert.mutate({ id: section?.id, categoryId, title, content, order })}
        >
          {upsert.isPending ? "Lagrer…" : "Lagre seksjon"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Avbryt</Button>
      </div>
    </div>
  );
}

export function HandbookSectionManager({ categoryId, sections }: Props) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const del = trpc.handbook.deleteSection.useMutation({
    onSuccess: () => {
      utils.handbook.listCategories.invalidate();
      utils.handbook.categoryById.invalidate({ id: categoryId });
      success("Seksjon slettet.");
    },
    onError: (err) => toastError(err.message),
  });

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <div key={s.id} className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 p-3">
            <button
              className="flex-1 flex items-center gap-2 text-left"
              onClick={() => toggle(s.id)}
            >
              {expanded.has(s.id)
                ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="font-medium text-sm truncate">{s.title}</span>
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => setEditingId(s.id)}
              aria-label="Rediger"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => del.mutate({ id: s.id })}
              disabled={del.isPending}
              aria-label="Slett"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {expanded.has(s.id) && editingId !== s.id && (
            <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap border-t pt-3">
              {s.content || <em>Tomt innhold</em>}
            </div>
          )}

          {editingId === s.id && (
            <div className="px-3 pb-3">
              <SectionEditor
                categoryId={categoryId}
                section={s}
                onDone={() => setEditingId(null)}
              />
            </div>
          )}
        </div>
      ))}

      {editingId === "new" ? (
        <SectionEditor
          categoryId={categoryId}
          onDone={() => setEditingId(null)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full min-h-[44px] gap-2 border-dashed"
          onClick={() => setEditingId("new")}
        >
          <Plus className="h-4 w-4" /> Legg til seksjon
        </Button>
      )}
    </div>
  );
}
