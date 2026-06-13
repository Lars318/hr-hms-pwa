"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  fullName: string;
  title: string | null;
  role: string;
}

interface LocationProps {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string;
  organizationName: string | null;
  safetyRepresentativeId: string | null;
  hseManagerId: string | null;
  safetyRepresentative: { id: string; fullName: string } | null;
  hseManager: { id: string; fullName: string } | null;
}

interface Props {
  location: LocationProps;
  profiles: Profile[];
}

export function LocationEditForm({ location, profiles }: Props) {
  const router = useRouter();
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address ?? "");
  const [city, setCity] = useState(location.city ?? "");
  const [organizationName, setOrganizationName] = useState(location.organizationName ?? "");
  const [safetyRepId, setSafetyRepId] = useState(location.safetyRepresentativeId ?? "");
  const [hseManagerId, setHseManagerId] = useState(location.hseManagerId ?? "");
  const [error, setError] = useState("");

  const update = trpc.location.update.useMutation();
  const setSafetyRep = trpc.location.setSafetyRepresentative.useMutation();
  const setHseMgr = trpc.location.setHseManager.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await Promise.all([
        update.mutateAsync({ id: location.id, name, address: address || undefined, city: city || undefined, organizationName: organizationName || undefined }),
        setSafetyRep.mutateAsync({ locationId: location.id, profileId: safetyRepId || null }),
        setHseMgr.mutateAsync({ locationId: location.id, profileId: hseManagerId || null }),
      ]);
      router.push(`/lokasjoner/${location.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  }

  const isPending = update.isPending || setSafetyRep.isPending || setHseMgr.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold">Nøkkelpersoner</p>
        <div className="space-y-2">
          <Label htmlFor="safetyRep">Verneombud</Label>
          <select
            id="safetyRep"
            value={safetyRepId}
            onChange={(e) => setSafetyRepId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Ikke satt</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}{p.title ? ` (${p.title})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hseMgr">HMS-ansvarlig</Label>
          <select
            id="hseMgr"
            value={hseManagerId}
            onChange={(e) => setHseManagerId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Ikke satt</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}{p.title ? ` (${p.title})` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="min-h-[44px]">
          {isPending ? "Lagrer…" : "Lagre endringer"}
        </Button>
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
