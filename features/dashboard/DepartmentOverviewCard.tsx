import Link from "next/link";
import { Users } from "lucide-react";

interface DepartmentRow {
  departmentId: string | null;
  department: { name: string } | null;
  _count: { id: number };
}

interface DepartmentOverviewCardProps {
  totalActive: number;
  byDepartment: DepartmentRow[];
}

export function DepartmentOverviewCard({ totalActive, byDepartment }: DepartmentOverviewCardProps) {
  const sorted = [...byDepartment].sort((a, b) => b._count.id - a._count.id);

  return (
    <div className="rounded-2xl border bg-card col-span-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Ansatte</h3>
        </div>
        <Link href="/ansatte" className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{totalActive}</span>
          <span className="text-sm text-muted-foreground">aktive ansatte</span>
        </div>

        {sorted.length > 0 && (
          <div className="space-y-1.5">
            {sorted.map((row) => {
              const pct = totalActive > 0 ? Math.round((row._count.id / totalActive) * 100) : 0;
              const name = row.department?.name ?? "Ingen avdeling";
              return (
                <div key={row.departmentId ?? "none"} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium">{row._count.id}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
