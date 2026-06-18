"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, MapPin, User, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type Answer = "YES" | "NO" | "PARTIAL" | "NA";

const answerOptions: { value: Answer; label: string; color: string }[] = [
  { value: "YES", label: "Ja", color: "bg-green-600 text-white" },
  { value: "PARTIAL", label: "Delvis", color: "bg-yellow-500 text-white" },
  { value: "NO", label: "Nei", color: "bg-destructive text-destructive-foreground" },
  { value: "NA", label: "N/A", color: "bg-muted text-muted-foreground" },
];

interface RecordItem {
  id: string;
  question: string;
  description: string | null;
  required: boolean;
}

interface RecordData {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  completedAt: string | null;
  location: { id: string; name: string } | null;
  performedBy: { id: string; fullName: string };
  template: { title: string; items: RecordItem[] };
  responses: { itemId: string; answer: string; comment: string | null }[];
}

interface Props {
  record: RecordData;
  canEdit: boolean;
}

export function HmsRundeChecklist({ record, canEdit }: Props) {
  const router = useRouter();

  const initialResponses: Record<string, { answer: Answer; comment: string }> = {};
  for (const r of record.responses) {
    initialResponses[r.itemId] = { answer: r.answer as Answer, comment: r.comment ?? "" };
  }

  const [responses, setResponses] = useState(initialResponses);
  const [notes, setNotes] = useState(record.notes ?? "");
  const [saving, setSaving] = useState<string | null>(null);

  const saveResponse = trpc.inspection.saveResponse.useMutation();
  const completeRecord = trpc.inspection.completeRecord.useMutation({
    onSuccess: () => router.refresh(),
  });

  async function handleAnswer(itemId: string, answer: Answer) {
    if (!canEdit) return;
    setResponses((prev) => ({
      ...prev,
      [itemId]: { answer, comment: prev[itemId]?.comment ?? "" },
    }));
    setSaving(itemId);
    await saveResponse.mutateAsync({ recordId: record.id, itemId, answer, comment: responses[itemId]?.comment });
    setSaving(null);
  }

  async function handleComment(itemId: string, comment: string) {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment },
    }));
  }

  async function handleCommentBlur(itemId: string) {
    if (!canEdit || !responses[itemId]?.answer) return;
    await saveResponse.mutateAsync({
      recordId: record.id,
      itemId,
      answer: responses[itemId].answer,
      comment: responses[itemId].comment,
    });
  }

  const answered = record.template.items.filter(
    (item) => responses[item.id]?.answer
  ).length;
  const requiredItems = record.template.items.filter((i) => i.required);
  const allRequiredAnswered = requiredItems.every((i) => responses[i.id]?.answer);

  async function handleComplete() {
    await completeRecord.mutateAsync({ recordId: record.id, notes: notes || undefined });
    router.refresh();
  }

  const isCompleted = record.status === "COMPLETED";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold">{record.title}</h1>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {isCompleted ? "Fullført" : "Pågående"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{record.template.title}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {record.performedBy.fullName}
          </span>
          {record.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {record.location.name}
            </span>
          )}
          {record.completedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Fullført {format(new Date(record.completedAt), "d. MMM yyyy", { locale: nb })}
            </span>
          )}
        </div>
        {!isCompleted && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(answered / record.template.items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {answered}/{record.template.items.length}
            </span>
          </div>
        )}
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {record.template.items.map((item, idx) => {
          const resp = responses[item.id];
          const isSaving = saving === item.id;
          return (
            <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {item.question}
                    {item.required && <span className="text-destructive ml-1">*</span>}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
                {isSaving && (
                  <span className="text-xs text-muted-foreground shrink-0">Lagrer…</span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {answerOptions.map((opt) => {
                  const selected = resp?.answer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleAnswer(item.id, opt.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                        selected
                          ? `${opt.color} border-transparent shadow-sm`
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      } disabled:opacity-60 disabled:cursor-default`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {resp?.answer && resp.answer !== "YES" && (
                <Textarea
                  placeholder="Kommentar (valgfritt)"
                  value={resp.comment}
                  disabled={!canEdit}
                  rows={2}
                  className="text-sm resize-none"
                  onChange={(e) => handleComment(item.id, e.target.value)}
                  onBlur={() => handleCommentBlur(item.id)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Complete section */}
      {!isCompleted && canEdit && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Avslutt runden</p>
          <Textarea
            placeholder="Generelle notater (valgfritt)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <Button
            className="w-full"
            disabled={!allRequiredAnswered || completeRecord.isLoading}
            onClick={handleComplete}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {completeRecord.isLoading ? "Fullfører..." : "Fullfør runde"}
          </Button>
          {!allRequiredAnswered && (
            <p className="text-xs text-muted-foreground text-center">
              Alle påkrevde spørsmål (*) må besvares
            </p>
          )}
        </div>
      )}

      {isCompleted && record.notes && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notater</p>
          <p className="text-sm">{record.notes}</p>
        </div>
      )}
    </div>
  );
}
