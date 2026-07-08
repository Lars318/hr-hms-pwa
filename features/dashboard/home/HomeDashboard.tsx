import { EmployeeHome } from "@/features/dashboard/employee/EmployeeHome";
import { LeaderHome } from "./LeaderHome";
import type { Role } from "@prisma/client";

interface Props {
  role: Role;
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  isContractor: boolean;
}

/**
 * Felles rolig startside — samme design på mobil og desktop, for alle roller.
 * Ansatte (og selvstendige) får den personlige «ro»-visningen; leder/HR/admin
 * får en handlingsrettet variant med godkjenninger og organisasjonshelse.
 */
export function HomeDashboard({ role, profileId, fullName, avatarUrl, isContractor }: Props) {
  const isLeader = !isContractor && (role === "MANAGER" || role === "HR" || role === "ADMIN");

  return (
    <div className="w-full max-w-5xl">
      {isLeader ? (
        <LeaderHome role={role} fullName={fullName} avatarUrl={avatarUrl} />
      ) : (
        <EmployeeHome profileId={profileId} fullName={fullName} avatarUrl={avatarUrl} />
      )}
    </div>
  );
}
