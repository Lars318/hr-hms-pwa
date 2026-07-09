import { EmployeeHome } from "@/features/dashboard/employee/EmployeeHome";
import { LeaderHome } from "./LeaderHome";
import { AdminWebDashboard } from "./AdminWebDashboard";
import type { Role } from "@prisma/client";

interface Props {
  role: Role;
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  isContractor: boolean;
}

/**
 * Felles rolig startside. Ansatte (og selvstendige) får den personlige
 * «ro»-visningen på alle skjermer. Leder/HR/admin får LeaderHome på mobil, og
 * admin/HR får i tillegg et rikt web-dashboard på desktop (KPI, kontrakter,
 * organisasjonshelse, godkjenninger, aktivitet og nyheter).
 */
export function HomeDashboard({ role, profileId, fullName, avatarUrl, isContractor }: Props) {
  const isLeader = !isContractor && (role === "MANAGER" || role === "HR" || role === "ADMIN");
  const hasWebDashboard = !isContractor && (role === "ADMIN" || role === "HR");

  if (!isLeader) {
    return (
      <div className="w-full max-w-5xl">
        <EmployeeHome profileId={profileId} fullName={fullName} avatarUrl={avatarUrl} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      {/* Mobil: rolig LeaderHome */}
      <div className={hasWebDashboard ? "lg:hidden" : ""}>
        <LeaderHome role={role} fullName={fullName} avatarUrl={avatarUrl} />
      </div>

      {/* Desktop (admin/HR): rikt web-dashboard */}
      {hasWebDashboard && (
        <div className="hidden lg:block">
          <AdminWebDashboard role={role} fullName={fullName} avatarUrl={avatarUrl} />
        </div>
      )}
    </div>
  );
}
