"use client";

import type { Role } from "@prisma/client";
import { NewEmployeeDashboard } from "./NewEmployeeDashboard";
import { NewManagerDashboard } from "./NewManagerDashboard";

interface Props {
  viewerRole: Role;
  viewerName: string;
  isHms: boolean;
}

export function PersonalizedDashboard({ viewerRole, viewerName, isHms }: Props) {
  if (viewerRole === "EMPLOYEE") return <NewEmployeeDashboard />;
  return <NewManagerDashboard role={viewerRole} />;
}
