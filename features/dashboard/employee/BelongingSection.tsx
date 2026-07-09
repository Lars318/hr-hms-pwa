import { Building2, Briefcase, MapPin, Star } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Ansatt",
  MANAGER:  "Leder",
  HR:       "HR",
  ADMIN:    "Administrator",
};

interface Assignment {
  id: string;
  isPrimary: boolean;
  roleLabel: string | null;
  location: { id: string; name: string; city: string | null };
  department: { id: string; name: string } | null;
}

interface BelongingSectionProps {
  department: { name: string } | null;
  role: string;
  title: string | null;
  assignments?: Assignment[];
}

export function BelongingSection({ department, role, title, assignments }: BelongingSectionProps) {
  const activeAssignments = assignments ?? [];

  if (activeAssignments.length === 0 && !department && !title) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tilhørighet</h2>
      <div className="rounded-2xl border bg-card divide-y">
        {activeAssignments.length > 0 ? (
          activeAssignments.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted mt-0.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium">{a.location.name}</p>
                  {a.isPrimary && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      Primær
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.roleLabel ?? title ?? ROLE_LABELS[role] ?? role}
                  {a.department ? ` · ${a.department.name}` : ""}
                  {a.location.city ? ` · ${a.location.city}` : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          <>
            {department && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avdeling</p>
                  <p className="text-sm font-medium">{department.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rolle</p>
                <p className="text-sm font-medium">{title ?? ROLE_LABELS[role] ?? role}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
