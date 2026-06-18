"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const { data: locations = [] } = trpc.location.list.useQuery(undefined, { staleTime: 300_000 });
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [primaryLocationId, setPrimaryLocationId] = useState<string>("");

  function toggleLocation(id: string) {
    setSelectedLocations((prev) => {
      const next = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id];
      // If primary was removed, auto-assign first remaining
      if (primaryLocationId === id && !next.includes(id)) {
        setPrimaryLocationId(next[0] ?? "");
      }
      // Auto-assign primary if none set
      if (!primaryLocationId && next.length > 0) {
        setPrimaryLocationId(next[0]);
      }
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        title: values.title || undefined,
        phone: values.phone || undefined,
        departmentId: values.departmentId || undefined,
        locationIds: selectedLocations.length > 0 ? selectedLocations : undefined,
        primaryLocationId: primaryLocationId || undefined,
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
        <Input id="title" {...register("title")} placeholder="f.eks. Personlig trener" />
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

      {/* Lokasjoner */}
      {locations.length > 0 && (
        <div className="space-y-2">
          <Label>Lokasjoner</Label>
          <div className="space-y-2">
            {locations.map((loc) => {
              const checked = selectedLocations.includes(loc.id);
              const isPrimary = primaryLocationId === loc.id;
              return (
                <div
                  key={loc.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                    checked ? "border-primary/40 bg-primary/5" : "border-input bg-background hover:bg-muted/40"
                  )}
                  onClick={() => toggleLocation(loc.id)}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLocation(loc.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-medium">
                    {loc.name}{loc.city ? `, ${loc.city}` : ""}
                  </span>
                  {checked && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPrimaryLocationId(loc.id); }}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                        isPrimary
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-primary"
                      )}
                      title="Sett som primærlokasjon"
                    >
                      <Star className="h-3 w-3" />
                      {isPrimary ? "Primær" : "Sett primær"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {selectedLocations.length === 0 && (
            <p className="text-xs text-muted-foreground">Ingen lokasjon valgt — kan settes senere.</p>
          )}
        </div>
      )}

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
