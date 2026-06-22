"use client";

import { useEffect } from "react";
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
import { LEAVE_TYPE_LABELS, requiresReason } from "@/lib/leave";
import { useToast } from "@/lib/toast";
import type { LeaveRequestType } from "@prisma/client";

const schema = z
  .object({
    type: z.enum([
      "VACATION", "SICK_LEAVE", "CARE_LEAVE", "EGENMELDING",
      "PARENTAL_LEAVE", "UNPAID_LEAVE", "OTHER",
    ] as const),
    startDate: z.string().min(1, "Startdato er påkrevd"),
    endDate: z.string().min(1, "Sluttdato er påkrevd"),
    locationId: z.string().optional(),
    reason: z.string().max(1000).optional(),
  })
  .refine((v) => new Date(v.startDate) <= new Date(v.endDate), {
    message: "Startdato må være før eller lik sluttdato",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

interface ExistingRequest {
  id: string;
  type: LeaveRequestType;
  startDate: Date;
  endDate: Date;
  reason: string | null;
}

interface LeaveRequestFormProps {
  mode: "create" | "edit";
  existing?: ExistingRequest;
}

export function LeaveRequestForm({ mode, existing }: LeaveRequestFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();

  const { data: locations = [] } = trpc.location.list.useQuery(undefined, { staleTime: 300_000 });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: existing?.type ?? "VACATION",
      startDate: existing?.startDate
        ? format(new Date(existing.startDate), "yyyy-MM-dd")
        : "",
      endDate: existing?.endDate
        ? format(new Date(existing.endDate), "yyyy-MM-dd")
        : "",
      locationId: "",
      reason: existing?.reason ?? "",
    },
  });

  const watchedType = watch("type");
  const needsReason = requiresReason(watchedType as LeaveRequestType);
  const isEgenmelding = watchedType === "EGENMELDING";

  const createMutation = trpc.leaveRequest.create.useMutation({
    onSuccess: (req) => {
      utils.leaveRequest.list.invalidate();
      success("Fraværssøknad sendt!");
      router.push(`/fravaer/${req.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  const updateMutation = trpc.leaveRequest.update.useMutation({
    onSuccess: (req) => {
      utils.leaveRequest.list.invalidate();
      utils.leaveRequest.byId.invalidate({ id: req.id });
      success("Søknad oppdatert!");
      router.push(`/fravaer/${req.id}`);
    },
    onError: (err) => toastError(err.message),
  });

  async function onSubmit(values: FormValues) {
    const payload = { ...values, locationId: values.locationId || undefined };
    if (mode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (existing) {
      await updateMutation.mutateAsync({ id: existing.id, ...payload });
    }
  }

  const serverError = createMutation.error?.message ?? updateMutation.error?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <Label htmlFor="type">Type fravær *</Label>
        <Select id="type" className="rounded-xl" {...register("type")}>
          {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveRequestType, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        {isEgenmelding && (
          <p className="text-xs text-muted-foreground bg-muted rounded p-2">
            Egenmelding teller alltid som 3 dager, uavhengig av faktisk varighet. Du har inntil 4 egenmeldinger per kalenderår.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="startDate">Fra dato *</Label>
          <Input id="startDate" type="date" className="rounded-xl" {...register("startDate")} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">Til dato *</Label>
          <Input id="endDate" type="date" className="rounded-xl" {...register("endDate")} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>
      </div>

      {locations.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="locationId">Lokasjon (valgfritt)</Label>
          <select
            id="locationId"
            {...register("locationId")}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Ikke spesifisert</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="reason">
          Begrunnelse {needsReason ? "*" : "(valgfritt)"}
        </Label>
        <Textarea
          id="reason"
          rows={3}
          className="rounded-xl"
          placeholder={needsReason ? "Begrunnelse er påkrevd for denne typen fravær" : "Legg til begrunnelse hvis ønskelig"}
          {...register("reason")}
        />
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? "Sender…" : mode === "create" ? "Send søknad" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
