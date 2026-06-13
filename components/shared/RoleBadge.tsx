import { Badge } from "@/components/ui/badge";
import type { Role } from "@prisma/client";

const roleConfig: Record<Role, { label: string; variant: "default" | "secondary" | "warning" | "outline" }> = {
  ADMIN: { label: "Administrator", variant: "default" },
  HR: { label: "HR", variant: "secondary" },
  MANAGER: { label: "Leder", variant: "warning" },
  EMPLOYEE: { label: "Ansatt", variant: "outline" },
};

export function RoleBadge({ role }: { role: Role }) {
  const { label, variant } = roleConfig[role];
  return <Badge variant={variant}>{label}</Badge>;
}
