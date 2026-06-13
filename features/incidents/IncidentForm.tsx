"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/lib/toast";
import { saveDraft, getDraft, deleteDraft } from "@/lib/offline/drafts";
import { syncPendingDrafts } from "@/lib/offline/syncQueue";
import type { Incident, Department, Profile, Role } from "@prisma/client";

const schema = z.object({
  title: z.string().min(3, "Tittel må ha minst 3 tegn").max(200),
  description: z.string().min(10, "Beskrivelse må ha minst 10 tegn"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  occurredAt: z.string().min(1, "Dato for hendelse er påkrevd"),
  dueDate: z.string().optional(),
  locationId: z.string().optional(),
  departmentId: z.string().optional(),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type IncidentFull = Incident & {
  reportedBy: Pick<Profile, "id" | "fullName" | "email">;
  assignedTo: Pick<Profile, "id" | "fullName" | "email"> | null;
  department: Pick<Department, "id" | "name"> | null;
};

interface IncidentFormProps {
  mode: "create" | "edit";
  incident?: IncidentFull;
  departments: Department[];
  profiles: Pick<Profile, "id" | "fullName">[];
  viewerRole: Role;
  viewerDepartmentId: string | null;
  viewerPrimaryLocationId?: string | null;
  draftId?: string;
}

function toLocalDatetimeValue(date: Date | string): string {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const AUTOSAVE_DRAFT_ID = "autosave";

export function IncidentForm({
  mode,
  incident,
  departments,
  profiles,
  viewerRole,
  viewerDepartmentId,
  viewerPrimaryLocationId,
  draftId = AUTOSAVE_DRAFT_ID,
}: IncidentFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isOnline = useOnlineStatus();
  const { success, error: toastError } = useToast();
  const canAssign =
    viewerRole === "ADMIN" || viewerRole === "HR" || viewerRole === "MANAGER";

  const { data: locations = [] } = trpc.location.list.useQuery(undefined, {
    staleTime: 300_000,
  });

  const savedDraft = mode === "create" ? getDraft(draftId) : undefined;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: savedDraft?.title ?? incident?.title ?? "",
      description: savedDraft?.description ?? incident?.description ?? "",
      severity: (savedDraft?.severity as FormValues["severity"]) ?? incident?.severity ?? "MEDIUM",
      occurredAt: savedDraft?.occurredAt
        ? toLocalDatetimeValue(savedDraft.occurredAt)
        : incident?.occurredAt
        ? toLocalDatetimeValue(incident.occurredAt)
        : "",
      dueDate: incident?.dueDate ? toLocalDatetimeValue(incident.dueDate) : "",
      locationId: (incident as (IncidentFull & { locationId?: string | null }) | undefined)?.locationId ?? viewerPrimaryLocationId ?? "",
      departmentId: savedDraft?.departmentId ?? incident?.departmentId ?? viewerDepartmentId ?? "",
      assignedToId: incident?.assignedToId ?? "",
    },
  });

  // Autosave draft every 30 seconds while offline (create mode only)
  const watchedValues = watch();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "create") return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (!isOnline && watchedValues.title) {
        saveDraft({
          id: draftId,
          title: watchedValues.title,
          description: watchedValues.description,
          severity: watchedValues.severity,
          location: "",
          occurredAt: watchedValues.occurredAt
            ? new Date(watchedValues.occurredAt).toISOString()
            : new Date().toISOString(),
          departmentId: watchedValues.departmentId ?? "",
        });
      }
    }, 30_000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [watchedValues, isOnline, mode, draftId]);

  // Sync pending drafts when coming back online
  const createMutation = trpc.incident.create.useMutation({
    onSuccess: (created) => {
      utils.incident.list.invalidate();
      success("Avvik rapportert!");
      router.push(`/avvik/${created.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  useEffect(() => {
    if (isOnline && mode === "create") {
      syncPendingDrafts(async (draft) => {
        return createMutation.mutateAsync({
          title: draft.title,
          description: draft.description,
          severity: draft.severity as FormValues["severity"],
          occurredAt: draft.occurredAt,
          departmentId: draft.departmentId || undefined,
        });
      });
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMutation = trpc.incident.update.useMutation({
    onSuccess: (updated) => {
      utils.incident.list.invalidate();
      utils.incident.byId.invalidate({ id: updated.id });
      success("Avvik oppdatert!");
      router.push(`/avvik/${updated.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    const toISO = (val: string | undefined) =>
      val ? new Date(val).toISOString() : undefined;

    const payload = {
      title: values.title,
      description: values.description,
      severity: values.severity,
      occurredAt: new Date(values.occurredAt).toISOString(),
      dueDate: toISO(values.dueDate),
      locationId: values.locationId || undefined,
      departmentId: values.departmentId || undefined,
      assignedToId: values.assignedToId || undefined,
    };

    if (!isOnline && mode === "create") {
      saveDraft({
        id: draftId,
        title: values.title,
        description: values.description,
        severity: values.severity,
        location: "",
        occurredAt: new Date(values.occurredAt).toISOString(),
        departmentId: values.departmentId ?? "",
      });
      router.push("/avvik?draft=saved");
      return;
    }

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      deleteDraft(draftId);
    } else if (incident) {
      await updateMutation.mutateAsync({ id: incident.id, ...payload });
    }
  }

  const serverError =
    createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      {!isOnline && mode === "create" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Du er frakoblet. Avviket lagres som kladd og sendes inn automatisk når du er tilkoblet igjen.
        </div>
      )}

      {savedDraft && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Gjenopprettet kladd fra {format(new Date(savedDraft.savedAt), "dd.MM.yyyy HH:mm")}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="title">Tittel *</Label>
        <Input
          id="title"
          placeholder="Kort beskrivelse av hendelsen"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beskrivelse *</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Beskriv hva som skjedde, omstendigheter, og eventuelle tiltak…"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="severity">Alvorlighetsgrad *</Label>
          <Select id="severity" {...register("severity")}>
            <option value="LOW">Lav</option>
            <option value="MEDIUM">Middels</option>
            <option value="HIGH">Høy</option>
            <option value="CRITICAL">Kritisk</option>
          </Select>
          {errors.severity && (
            <p className="text-xs text-destructive">{errors.severity.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="occurredAt">Dato og tid for hendelse *</Label>
          <Input id="occurredAt" type="datetime-local" {...register("occurredAt")} />
          {errors.occurredAt && (
            <p className="text-xs text-destructive">{errors.occurredAt.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="dueDate">Frist for lukking</Label>
          <Input id="dueDate" type="datetime-local" {...register("dueDate")} />
        </div>

        {locations.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="locationId">Lokasjon</Label>
            <Select id="locationId" {...register("locationId")}>
              <option value="">Ikke spesifisert</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {canAssign && (
        <div className="space-y-1">
          <Label htmlFor="assignedToId">Tildel til</Label>
          <Select id="assignedToId" {...register("assignedToId")}>
            <option value="">Ikke tildelt</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </Select>
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="sm:w-auto w-full min-h-[44px]">
          {isSubmitting
            ? "Lagrer…"
            : !isOnline && mode === "create"
            ? "Lagre som kladd"
            : mode === "create"
            ? "Rapporter avvik"
            : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="sm:w-auto w-full min-h-[44px]">
          Avbryt
        </Button>
      </div>
    </form>
  );
}
