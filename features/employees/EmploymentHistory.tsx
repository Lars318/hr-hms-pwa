"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Plus, Banknote, Briefcase, Clock } from "lucide-react";

const SALARY_TYPE_LABELS: Record<string, string> = {
  MONTHLY: "per måned",
  HOURLY: "per time",
  ANNUAL: "per år",
};

function formatNOK(amount: number) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(amount);
}

interface Props { profileId: string }

export function EmploymentHistory({ profileId }: Props) {
  const { data: records = [], isLoading, refetch } = trpc.employmentRecord.list.useQuery({ profileId });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [percentage, setPercentage] = useState("100");
  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState<"MONTHLY" | "HOURLY" | "ANNUAL">("MONTHLY");
  const [jobTitle, setJobTitle] = useState("");
  const [notes, setNotes] = useState("");

  const create = trpc.employmentRecord.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setEffectiveFrom(""); setPercentage("100"); setSalary(""); setJobTitle(""); setNotes("");
      refetch();
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveFrom) return setError("Gyldig fra er påkrevd");
    create.mutate({
      profileId,
      effectiveFrom,
      employmentPercentage: Number(percentage),
      salary: salary ? Number(salary) : undefined,
      salaryType,
      jobTitle: jobTitle || undefined,
      notes: notes || undefined,
    });
  }

  if (isLoading) {
    return <div className="h-24 rounded-lg border bg-card animate-pulse" />;
  }

  const current = records.find((r) => !r.effectiveTo);

  return (
    <div className="space-y-4">
      {/* Current */}
      {current && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">Gjeldende</Badge>
            <span className="text-xs text-muted-foreground">
              Fra {format(new Date(current.effectiveFrom), "d. MMM yyyy", { locale: nb })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {current.jobTitle && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Stilling</p>
                  <p className="text-sm font-medium">{current.jobTitle}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stillingsprosent</p>
                <p className="text-sm font-medium">{current.employmentPercentage}%</p>
              </div>
            </div>
            {current.salary && (
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Lønn</p>
                  <p className="text-sm font-medium">
                    {formatNOK(current.salary)} {SALARY_TYPE_LABELS[current.salaryType]}
                  </p>
                </div>
              </div>
            )}
          </div>
          {current.notes && <p className="text-xs text-muted-foreground">{current.notes}</p>}
        </div>
      )}

      {/* History */}
      {records.filter((r) => r.effectiveTo).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Historikk</p>
          {records.filter((r) => r.effectiveTo).map((r) => (
            <div key={r.id} className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(r.effectiveFrom), "d. MMM yyyy", { locale: nb })}</span>
                <span>–</span>
                <span>{format(new Date(r.effectiveTo!), "d. MMM yyyy", { locale: nb })}</span>
              </div>
              <div className="flex gap-4">
                {r.jobTitle && <span>{r.jobTitle}</span>}
                <span>{r.employmentPercentage}%</span>
                {r.salary && <span>{formatNOK(r.salary)} {SALARY_TYPE_LABELS[r.salaryType]}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new record form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Ny lønns-/stillingsendring</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="er-from">Gyldig fra *</Label>
              <Input id="er-from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="er-pct">Stillingsprosent</Label>
              <Input id="er-pct" type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="er-title">Stillingstittel</Label>
            <Input id="er-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="F.eks. Seniorrådgiver" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="er-salary">Lønn (NOK)</Label>
              <Input id="er-salary" type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="er-stype">Type</Label>
              <select
                id="er-stype"
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as typeof salaryType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MONTHLY">Per måned</option>
                <option value="HOURLY">Per time</option>
                <option value="ANNUAL">Per år</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="er-notes">Notat (valgfritt)</Label>
            <Input id="er-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="F.eks. lønnsforhandling 2026" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Lagrer..." : "Lagre"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Avbryt</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {records.length === 0 ? "Legg til lønn og stilling" : "Registrer endring"}
        </Button>
      )}
    </div>
  );
}
