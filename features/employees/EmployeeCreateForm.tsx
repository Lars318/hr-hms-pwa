"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Department } from "@prisma/client";

const schema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(8, "Passordet må være minst 8 tegn"),
  fullName: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  title: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]),
  departmentId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeCreateForm({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "EMPLOYEE" },
  });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        title: values.title || undefined,
        phone: values.phone || undefined,
        departmentId: values.departmentId || undefined,
      }),
    });

    const data = await res.json() as { ok?: boolean; profileId?: string; error?: string };

    if (!data.ok) {
      setError("root", { message: data.error ?? "Noe gikk galt" });
      return;
    }

    router.push(`/ansatte/${data.profileId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="fullName">Fullt navn *</Label>
        <Input id="fullName" {...register("fullName")} placeholder="Ola Nordmann" />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">E-post *</Label>
        <Input id="email" type="email" {...register("email")} placeholder="ola@bedrift.no" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Midlertidig passord *</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        <p className="text-xs text-muted-foreground">Brukeren bør bytte passord ved første innlogging.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Stillingstittel</Label>
        <Input id="title" {...register("title")} placeholder="f.eks. Personalsjef" />
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
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oppretter…" : "Opprett ansatt"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
