import { Badge } from "@/components/ui/badge";
import type { IncidentStatus } from "@prisma/client";

const config: Record<IncidentStatus, { label: string; className: string }> = {
  OPEN:        { label: "Åpen",         className: "bg-blue-100 text-blue-800 border-transparent" },
  IN_PROGRESS: { label: "Under arbeid", className: "bg-yellow-100 text-yellow-800 border-transparent" },
  RESOLVED:    { label: "Løst",         className: "bg-green-100 text-green-800 border-transparent" },
  CLOSED:      { label: "Lukket",       className: "bg-muted text-muted-foreground border-transparent" },
};

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}
