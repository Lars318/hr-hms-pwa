"use client";

import { useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Award } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { CATEGORY_LABELS } from "./CertificationSection";

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function status(expiresAt: Date | null) {
  if (!expiresAt) return { label: "Uten utløp", cls: "bg-muted text-muted-foreground" };
  const days = differenceInCalendarDays(new Date(expiresAt), new Date());
  if (days < 0) return { label: "Utløpt", cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days} d igjen`, cls: "bg-amber-100 text-amber-700" };
  return { label: "Gyldig", cls: "bg-emerald-100 text-emerald-700" };
}

export function CertificationMatrix() {
  const [category, setCategory] = useState<string>("");
  const [onlyExpiring, setOnlyExpiring] = useState(false);

  const { data: certs = [], isLoading } = trpc.certification.matrix.useQuery({
    category: (category || undefined) as never,
    onlyExpiring: onlyExpiring || undefined,
  });

  const chipClass = (active: boolean) =>
    cn("shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCategory("")} className={chipClass(category === "")}>Alle</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={chipClass(category === c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
        <button
          onClick={() => setOnlyExpiring((v) => !v)}
          className={cn("shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            onlyExpiring ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
        >
          Utløper snart / utløpt
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : certs.length === 0 ? (
        <EmptyState icon={Award} title="Ingen sertifikater" description="Ingen treffer på valgt filter." />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ansatt</th>
                <th className="px-4 py-3 font-medium">Sertifikat</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Kategori</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Utløper</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => {
                const s = status(c.expiresAt);
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/ansatte/${c.profile.id}`} className="font-medium hover:underline">
                        {c.profile.fullName}
                      </Link>
                      {c.profile.department && (
                        <span className="block text-xs text-muted-foreground">{c.profile.department.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {CATEGORY_LABELS[c.category] ?? c.category}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {c.expiresAt ? format(new Date(c.expiresAt), "d. MMM yyyy", { locale: nb }) : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", s.cls)}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{certs.length} sertifikater</p>
    </div>
  );
}
