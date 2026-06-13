import { Badge } from "@/components/ui/badge";
import type { IncidentSeverity } from "@prisma/client";

const config: Record<IncidentSeverity, { label: string; className: string }> = {
  LOW:      { label: "Lav",      className: "bg-green-100 text-green-800 border-transparent" },
  MEDIUM:   { label: "Middels",  className: "bg-yellow-100 text-yellow-800 border-transparent" },
  HIGH:     { label: "Høy",      className: "bg-orange-100 text-orange-800 border-transparent" },
  CRITICAL: { label: "Kritisk",  className: "bg-red-100 text-red-800 border-transparent" },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const { label, className } = config[severity];
  return <Badge className={className}>{label}</Badge>;
}
