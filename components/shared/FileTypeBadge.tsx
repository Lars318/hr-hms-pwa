import { Badge } from "@/components/ui/badge";
import { MIME_LABELS } from "@/lib/supabase/admin";

interface FileTypeBadgeProps {
  mimeType: string;
}

export function FileTypeBadge({ mimeType }: FileTypeBadgeProps) {
  const label = MIME_LABELS[mimeType] ?? mimeType.split("/")[1]?.toUpperCase() ?? "FIL";
  return <Badge variant="outline" className="font-mono text-xs">{label}</Badge>;
}
