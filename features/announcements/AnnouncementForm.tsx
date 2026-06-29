"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ANNOUNCEMENT_CATEGORIES } from "./categories";

interface AnnouncementFormProps {
  onSuccess?: () => void;
}

export function AnnouncementForm({ onSuccess }: AnnouncementFormProps) {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("INFO");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const mutation = trpc.announcement.create.useMutation({
    onSuccess: () => {
      utils.announcement.list.invalidate();
      success("Kunngjøring publisert!");
      setTitle("");
      setBody("");
      setCategory("INFO");
      setLinkUrl("");
      setLinkLabel("");
      onSuccess?.();
    },
    onError: (err) => toastError(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({
          title,
          body,
          category: category as "INFO" | "EVENT" | "DOCUMENT" | "ALERT" | "CELEBRATION",
          linkUrl: linkUrl.trim() || undefined,
          linkLabel: linkLabel.trim() || undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="ann-title">Tittel *</Label>
        <Input
          id="ann-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kort tittel..."
          className="h-12 text-base"
          required
        />
      </div>

      {/* Kategori med ikon */}
      <div className="space-y-2">
        <Label>Kategori</Label>
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? c.chip + " border-transparent" : "bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ann-body">Innhold *</Label>
        <Textarea
          id="ann-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Skriv kunngjøringen her..."
          rows={5}
          className="text-base resize-none"
          required
        />
      </div>

      {/* Valgfri lenke */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="space-y-2">
          <Label htmlFor="ann-link">Lenke (valgfritt)</Label>
          <Input
            id="ann-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/dokumenter eller https://…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ann-link-label">Lenketekst</Label>
          <Input
            id="ann-link-label"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Åpne dokument"
            className="sm:w-44"
          />
        </div>
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full h-12 text-base">
        {mutation.isPending ? "Publiserer…" : "Publiser kunngjøring"}
      </Button>
    </form>
  );
}
