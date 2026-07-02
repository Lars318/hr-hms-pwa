import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { LeaveRequestStatusBadge } from "./LeaveRequestStatusBadge";
import { LeaveRequestTypeBadge } from "./LeaveRequestTypeBadge";
import { AdminDeleteLeaveButton } from "./AdminDeleteLeaveButton";
import type { LeaveRequestStatus, LeaveRequestType } from "@prisma/client";

interface LeaveRow {
  id: string;
  type: LeaveRequestType;
  status: LeaveRequestStatus;
  startDate: Date;
  endDate: Date;
  days: number;
  employee: { id: string; fullName: string };
  department: { id: string; name: string } | null;
}

interface LeaveRequestTableProps {
  requests: LeaveRow[];
  showEmployee?: boolean;
  canAdminDelete?: boolean;
}

export function LeaveRequestTable({ requests, showEmployee = false, canAdminDelete = false }: LeaveRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-md border">
        <p className="py-12 text-center text-sm text-muted-foreground">Ingen søknader funnet</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobil: kort ──────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {requests.map((r) => (
          <Link key={r.id} href={`/fravaer/${r.id}`} className="block">
            <div className="rounded-2xl border bg-card p-4 active:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  {showEmployee && (
                    <p className="font-medium truncate">{r.employee.fullName}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <LeaveRequestTypeBadge type={r.type} />
                    <LeaveRequestStatusBadge status={r.status} />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-1">
                  {canAdminDelete && <AdminDeleteLeaveButton requestId={r.id} />}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground min-w-0">
                <span>
                  {format(new Date(r.startDate), "d. MMM", { locale: nb })}
                  {" – "}
                  {format(new Date(r.endDate), "d. MMM yyyy", { locale: nb })}
                </span>
                <span className="shrink-0 ml-2">{r.days} dager</span>
              </div>
              {r.department && (
                <p className="mt-1 text-xs text-muted-foreground truncate">{r.department.name}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Desktop: tabell ──────────────────────────────────────────── */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {showEmployee && <th className="px-4 py-3 text-left font-medium">Ansatt</th>}
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Periode</th>
              <th className="px-4 py-3 text-left font-medium">Dager</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Avdeling</th>
              {canAdminDelete && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                {showEmployee && (
                  <td className="px-4 py-3 font-medium">{r.employee.fullName}</td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/fravaer/${r.id}`} className="hover:underline">
                    <LeaveRequestTypeBadge type={r.type} />
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(r.startDate), "d. MMM", { locale: nb })}
                  {" – "}
                  {format(new Date(r.endDate), "d. MMM yyyy", { locale: nb })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.days}</td>
                <td className="px-4 py-3">
                  <LeaveRequestStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.department?.name ?? "—"}
                </td>
                {canAdminDelete && (
                  <td className="px-4 py-3">
                    <AdminDeleteLeaveButton requestId={r.id} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
