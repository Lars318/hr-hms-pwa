"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";

interface TemplateItem {
  id: string;
  question: string;
  description: string | null;
  order: number;
  required: boolean;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  recordCount: number;
  items: TemplateItem[];
}

interface Props {
  templates: Template[];
}

type NewItem = { question: string; description: string; required: boolean };

export function TemplateAdmin({ templates }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<NewItem[]>([
    { question: "", description: "", required: true },
  ]);
  const [error, setError] = useState("");

  const create = trpc.inspection.createTemplate.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setTitle("");
      setDescription("");
      setItems([{ question: "", description: "", required: true }]);
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  function addItem() {
    setItems((prev) => [...prev, { question: "", description: "", required: true }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<NewItem>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Tittel er påkrevd");
    const validItems = items.filter((i) => i.question.trim());
    if (!validItems.length) return setError("Legg til minst ett spørsmål");
    create.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      items: validItems.map((item, idx) => ({
        question: item.question.trim(),
        description: item.description.trim() || undefined,
        order: idx + 1,
        required: item.required,
      })),
    });
  }

  return (
    <div className="space-y-4">
      {/* Existing templates */}
      {templates.map((t) => (
        <div key={t.id} className="rounded-lg border bg-card overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
          >
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.items.length} spørsmål · {t.recordCount} runder gjennomført
              </p>
            </div>
            {expanded === t.id ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expanded === t.id && (
            <div className="border-t px-4 py-3 space-y-2">
              {t.description && (
                <p className="text-sm text-muted-foreground">{t.description}</p>
              )}
              <ol className="space-y-1">
                {t.items.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{idx + 1}.</span>
                    <span>
                      {item.question}
                      {item.required && <span className="text-destructive ml-1 text-xs">*</span>}
                      {item.description && (
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}

      {/* New template form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="text-sm font-semibold">Ny mal</h2>

          <div className="space-y-2">
            <Label htmlFor="mal-title">Tittel</Label>
            <Input id="mal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Standard vernerunde" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mal-desc">Beskrivelse (valgfritt)</Label>
            <Input id="mal-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Spørsmål</Label>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={`Spørsmål ${idx + 1}`}
                    value={item.question}
                    onChange={(e) => updateItem(idx, { question: e.target.value })}
                  />
                  <Input
                    placeholder="Beskrivelse (valgfritt)"
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    className="text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) => updateItem(idx, { required: e.target.checked })}
                    />
                    Påkrevd
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 mt-1"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Legg til spørsmål
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isLoading}>
              {create.isLoading ? "Lagrer..." : "Opprett mal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Avbryt
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ny mal
        </Button>
      )}
    </div>
  );
}
