"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocationCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [staffed, setStaffed] = useState(true);
  const [error, setError] = useState("");

  const create = trpc.location.create.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const loc = await create.mutateAsync({
        name,
        address: address || undefined,
        city: city || undefined,
        organizationName: organizationName || undefined,
        staffed,
      });
      router.push(`/lokasjoner/${loc.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="F.eks. Ski treningssenter" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org">Organisasjonsnavn</Label>
          <Input id="org" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="F.eks. PulsFollo AS" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Gatenavn 1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">By</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ski" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bemanning</Label>
          <div className="flex gap-2">
            {[
              { v: true, label: "Bemannet", desc: "Har egne ansatte" },
              { v: false, label: "Ubemannet", desc: "Ingen fast bemanning / kun selvstendige" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setStaffed(opt.v)}
                className={`flex-1 text-left rounded-xl border p-3 transition-colors ${
                  staffed === opt.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Ubemannede lokasjoner krever ikke verneombud/HMS-ansvarlig på samme måte.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={create.isPending} className="min-h-[44px]">
          {create.isPending ? "Oppretter…" : "Opprett lokasjon"}
        </Button>
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
