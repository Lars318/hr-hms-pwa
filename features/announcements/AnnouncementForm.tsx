"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/toast";

interface AnnouncementFormProps {
  onSuccess?: () => void;
}

export function AnnouncementForm({ onSuccess }: AnnouncementFormProps) {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const mutation = trpc.announcement.create.useMutation({
    onSuccess: () => {
      utils.announcement.list.invalidate();
      success("Kunngjøring publisert!");
      setTitle("");
      setBody("");
      onSuccess?.();
    },
    onError: (err) => toastError(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ title, body });
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
      <Button type="submit" disabled={mutation.isPending} className="w-full h-12 text-base">
        {mutation.isPending ? "Publiserer…" : "Publiser kunngjøring"}
      </Button>
    </form>
  );
}
