"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, AlertCircle, Clock, User, CalendarDays } from "lucide-react";
import { format, differenceInCalendarDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";

const STEP_META: Record<string, { label: string; description: string }> = {
  OPPFOLGING_PLAN: {
    label: "Oppfølgingsplan",
    description: "Innen uke 4 (dag 28) – arbeidsgiver og arbeidstaker lager plan for tilbakekomst.",
  },
  DIALOG_MOTE_1: {
    label: "Dialogmøte 1",
    description: "Innen uke 7 (dag 49) – arbeidsgiver innkaller til møte med arbeidstaker.",
  },
  DIALOG_MOTE_2: {
    label: "Dialogmøte 2",
    description: "Innen uke 26 (dag 182) – NAV kan delta. Arbeidstaker kan be om utsettelse.",
  },
  NAV_NOTIFICATION: {
    label: "NAV-varsel",
    description: "Innen uke 26 (dag 182) – varsle NAV om videre oppfølgingsbehov.",
  },
};

interface Step {
  id: string;
  type: string;
  dueDate: Date | string;
  completedAt: Date | string | null;
  notes: string | null;
  completedBy: { id: string; fullName: string } | null;
}

interface SickCase {
  id: string;
  startDate: Date | string;
  returnDate: Date | string | null;
  totalDays: number;
  status: string;
  notes: string | null;
  employee: { id: string; fullName: string; email: string };
  steps: Step[];
}

interface Props {
  sickCase: SickCase;
  canManage: boolean;
}

export function SickCaseDetail({ sickCase, canManage }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [totalDays, setTotalDays] = useState(String(sickCase.totalDays));
  const [closing, setClosing] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const completeStep = trpc.sickLeave.completeStep.useMutation({
    onSuccess: () => {
      utils.sickLeave.byId.invalidate({ id: sickCase.id });
      setCompletingStep(null);
      router.refresh();
    },
  });

  const updateDays = trpc.sickLeave.updateDays.useMutation({
    onSuccess: () => router.refresh(),
  });

  const close = trpc.sickLeave.close.useMutation({
    onSuccess: () => {
      setClosing(false);
      router.refresh();
    },
  });

  const isActive = sickCase.status === "ACTIVE";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">{sickCase.employee.fullName}</h1>
              <Badge variant={isActive ? "secondary" : "outline"}>
                {isActive ? "Aktiv" : "Lukket"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{sickCase.employee.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Første fraværsdag</p>
            <p className="font-medium">{format(new Date(sickCase.startDate), "d. MMMM yyyy", { locale: nb })}</p>
          </div>
          {sickCase.returnDate && (
            <div>
              <p className="text-xs text-muted-foreground">Tilbake</p>
              <p className="font-medium">{format(new Date(sickCase.returnDate), "d. MMMM yyyy", { locale: nb })}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Antall dager</p>
            {canManage && isActive ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  value={totalDays}
                  onChange={(e) => setTotalDays(e.target.value)}
                  className="h-7 w-20 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={updateDays.isPending}
                  onClick={() => updateDays.mutate({ id: sickCase.id, totalDays: Number(totalDays) })}
                >
                  Lagre
                </Button>
              </div>
            ) : (
              <p className="font-medium">{sickCase.totalDays} dager</p>
            )}
          </div>
        </div>

        {sickCase.notes && (
          <p className="text-sm text-muted-foreground border-t pt-2">{sickCase.notes}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Milepæler</h2>
        <div className="space-y-3">
          {sickCase.steps.map((step) => {
            const due = new Date(step.dueDate);
            const done = !!step.completedAt;
            const overdue = !done && isPast(due);
            const daysLeft = differenceInCalendarDays(due, new Date());
            const meta = STEP_META[step.type];
            const isExpanding = completingStep === step.id;

            return (
              <div key={step.id} className={`rounded-lg border p-3 space-y-2 ${overdue ? "border-destructive/50 bg-destructive/5" : done ? "border-green-500/30 bg-green-500/5" : ""}`}>
                <div className="flex items-start gap-3">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : overdue ? (
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{meta?.label ?? step.type}</p>
                      {done && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                          Fullført
                        </Badge>
                      )}
                      {overdue && !done && (
                        <Badge variant="destructive" className="text-xs">Forfalt</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{meta?.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Frist: {format(due, "d. MMM yyyy", { locale: nb })}
                      </span>
                      {!done && (
                        <span className={overdue ? "text-destructive font-medium" : ""}>
                          {overdue ? `${Math.abs(daysLeft)} dager over frist` : `${daysLeft} dager igjen`}
                        </span>
                      )}
                      {done && step.completedBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {step.completedBy.fullName}
                        </span>
                      )}
                      {done && step.completedAt && (
                        <span>{format(new Date(step.completedAt), "d. MMM yyyy", { locale: nb })}</span>
                      )}
                    </div>
                    {step.notes && <p className="text-xs text-muted-foreground mt-1 italic">{step.notes}</p>}
                  </div>
                  {canManage && isActive && !done && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-7 text-xs"
                      onClick={() => setCompletingStep(isExpanding ? null : step.id)}
                    >
                      {isExpanding ? "Avbryt" : "Fullfør"}
                    </Button>
                  )}
                </div>

                {isExpanding && (
                  <div className="ml-8 space-y-2">
                    <Textarea
                      placeholder="Referat / notat (valgfritt)"
                      rows={2}
                      value={stepNotes[step.id] ?? ""}
                      onChange={(e) => setStepNotes((p) => ({ ...p, [step.id]: e.target.value }))}
                      className="text-sm resize-none"
                    />
                    <Button
                      size="sm"
                      disabled={completeStep.isPending}
                      onClick={() => completeStep.mutate({ stepId: step.id, notes: stepNotes[step.id] })}
                    >
                      {completeStep.isPending ? "Lagrer..." : "Bekreft fullført"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Close case */}
      {canManage && isActive && (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Lukk sak</h2>
          {!closing ? (
            <Button variant="outline" onClick={() => setClosing(true)}>
              Registrer tilbakekomst og lukk sak
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tilbake i arbeid (valgfritt)</label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Avsluttende notat</label>
                <Textarea rows={2} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} className="resize-none" />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={close.isPending}
                  onClick={() => close.mutate({ id: sickCase.id, returnDate: returnDate || undefined, notes: closeNotes || undefined })}
                >
                  {close.isPending ? "Lukker..." : "Lukk sak"}
                </Button>
                <Button variant="outline" onClick={() => setClosing(false)}>Avbryt</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
