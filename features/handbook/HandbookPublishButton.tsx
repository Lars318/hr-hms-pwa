"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export function HandbookPublishButton() {
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const publish = trpc.handbook.publish.useMutation({
    onSuccess: (v) => {
      utils.handbook.latestVersion.invalidate();
      utils.handbook.versionHistory.invalidate();
      utils.handbook.readStatus.invalidate();
      success(`Versjon ${v.version} er publisert og varsler er sendt!`);
      setNote("");
      setShowForm(false);
    },
    onError: (err) => toastError(err.message),
  });

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="min-h-[44px] gap-2">
        <Send className="h-4 w-4" />
        Publiser ny versjon
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 max-w-lg">
      <h3 className="font-medium">Publiser ny versjon</h3>
      <div className="space-y-1">
        <Label htmlFor="publish-note">Endringsnotat (valgfritt)</Label>
        <Textarea
          id="publish-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Hva er nytt i denne versjonen?"
          maxLength={500}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Alle aktive ansatte vil motta varsel (in-app, e-post og push).
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => publish.mutate({ publishNote: note || undefined })}
          disabled={publish.isPending}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {publish.isPending ? "Publiserer…" : "Publiser og send varsel"}
        </Button>
        <Button variant="outline" onClick={() => setShowForm(false)}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
