"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Profile, Department } from "@prisma/client";

const editSchema = z.object({
  fullName: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  title: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  departmentId: z.string().optional(),
});

const createSchema = editSchema.extend({
  supabaseUserId: z.string().min(10, "Supabase UUID er påkrevd"),
  email: z.string().email("Ugyldig e-postadresse"),
});

type EditValues = z.infer<typeof editSchema>;
type CreateValues = z.infer<typeof createSchema>;

interface EmployeeFormEditProps {
  mode: "edit";
  profile: Profile & { department: Department | null };
  departments: Department[];
}

interface EmployeeFormCreateProps {
  mode: "create";
  profile?: never;
  departments: Department[];
}

type EmployeeFormProps = EmployeeFormEditProps | EmployeeFormCreateProps;

export function EmployeeForm({ profile, departments, mode }: EmployeeFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: profile?.fullName ?? "",
      title: profile?.title ?? "",
      phone: profile?.phone ?? "",
      role: profile?.role ?? "EMPLOYEE",
      status: profile?.status ?? "ACTIVE",
      departmentId: profile?.departmentId ?? "",
    },
  });

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      supabaseUserId: "",
      email: "",
      fullName: "",
      title: "",
      phone: "",
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: "",
    },
  });

  const updateMutation = trpc.profile.adminUpdate.useMutation({
    onSuccess: () => {
      utils.profile.list.invalidate();
      utils.profile.byId.invalidate();
      router.push(`/ansatte/${profile?.id}`);
    },
  });

  const createMutation = trpc.profile.create.useMutation({
    onSuccess: (created) => {
      utils.profile.list.invalidate();
      router.push(`/ansatte/${created.id}`);
    },
  });

  const form = mode === "edit" ? editForm : createForm;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form as ReturnType<typeof useForm<CreateValues>>;

  async function onSubmit(values: CreateValues) {
    const clean = {
      ...values,
      departmentId: values.departmentId || undefined,
      title: values.title || undefined,
      phone: values.phone || undefined,
    };

    if (mode === "edit" && profile) {
      await updateMutation.mutateAsync({ id: profile.id, ...clean });
    } else {
      await createMutation.mutateAsync(clean);
    }
  }

  const serverError = updateMutation.error?.message ?? createMutation.error?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-5 max-w-lg">
      {mode === "create" && (
        <>
          <div className="space-y-1">
            <Label htmlFor="supabaseUserId">Supabase bruker-UUID *</Label>
            <Input
              id="supabaseUserId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              {...register("supabaseUserId")}
            />
            {errors.supabaseUserId && (
              <p className="text-xs text-destructive">{errors.supabaseUserId.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-post *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-1">
        <Label htmlFor="fullName">Fullt navn *</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Stillingstittel</Label>
        <Input id="title" placeholder="f.eks. Personalsjef" {...register("title")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" type="tel" {...register("phone")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="role">Rolle *</Label>
          <Select id="role" {...register("role")}>
            <option value="EMPLOYEE">Ansatt</option>
            <option value="MANAGER">Leder</option>
            <option value="HR">HR</option>
            <option value="ADMIN">Administrator</option>
          </Select>
          {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="status">Status *</Label>
          <Select id="status" {...register("status")}>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="departmentId">Avdeling</Label>
        <Select id="departmentId" {...register("departmentId")}>
          <option value="">Ingen avdeling</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer…" : mode === "create" ? "Opprett ansatt" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
