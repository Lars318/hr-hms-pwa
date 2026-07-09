"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusConfig = {
  IN_PROGRESS: { label: "Pågående", icon: Clock, variant: "secondary" as const },
  COMPLETED: { label: "Fullført", icon: CheckCircle2, variant: "default" as const },
  CANCELLED: { label: "Avbrutt", icon: XCircle, variant: "destructive" as const },
};

interface Props {
  profileId: string;
  isHrAdmin: boolean;
}

export function HmsRundeList({ isHrAdmin }: Props) {
  const { data: records, isLoading } = trpc.inspection.listRecords.useQuery({});

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!records?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-medium">Ingen HMS-runder ennå</p>
        <p className="text-sm mt-1">Start en ny runde for å komme i gang.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const cfg = statusConfig[record.status];
        const StatusIcon = cfg.icon;
        return (
          <Link
            key={record.id}
            href={`/hms-runde/${record.id}`}
            className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{record.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {record.template.title}
                  {record.location ? ` · ${record.location.name}` : ""}
                  {isHrAdmin && record.performedBy ? ` · ${record.performedBy.fullName}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <Badge variant={cfg.variant} className="hidden sm:inline-flex">{cfg.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(record.createdAt), "d. MMM", { locale: nb })}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
