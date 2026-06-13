import { Building2, Briefcase } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Ansatt",
  MANAGER:  "Leder",
  HR:       "HR",
  ADMIN:    "Administrator",
};

interface BelongingSectionProps {
  department: { name: string } | null;
  role: string;
  title: string | null;
}

export function BelongingSection({ department, role, title }: BelongingSectionProps) {
  if (!department && !title) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tilhørighet</h2>
      <div className="rounded-2xl border bg-card divide-y">
        {department && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avdeling</p>
              <p className="text-sm font-medium">{department.name}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rolle</p>
            <p className="text-sm font-medium">{title ?? ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
