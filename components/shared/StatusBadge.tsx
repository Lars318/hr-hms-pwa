import { Badge } from "@/components/ui/badge";
import type { ProfileStatus } from "@prisma/client";

export function StatusBadge({ status }: { status: ProfileStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "success" : "muted"}>
      {status === "ACTIVE" ? "Aktiv" : "Inaktiv"}
    </Badge>
  );
}
