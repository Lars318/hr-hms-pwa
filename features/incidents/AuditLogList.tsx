import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { AuditLog, Profile } from "@prisma/client";

type AuditLogWithActor = AuditLog & {
  actor: Pick<Profile, "id" | "fullName">;
};

const actionLabels: Record<string, string> = {
  CREATE: "Opprettet avvik",
  UPDATE: "Redigerte avvik",
  STATUS_CHANGE: "Endret status",
};

function formatMetadata(log: AuditLogWithActor): string | null {
  if (!log.metadata || typeof log.metadata !== "object") return null;
  const meta = log.metadata as Record<string, unknown>;

  if (log.action === "STATUS_CHANGE") {
    const from = meta.from as string;
    const to = meta.to as string;
    const comment = meta.comment as string | undefined;
    const statusMap: Record<string, string> = {
      OPEN: "Åpen", IN_PROGRESS: "Under arbeid", RESOLVED: "Løst", CLOSED: "Lukket",
    };
    let text = `${statusMap[from] ?? from} → ${statusMap[to] ?? to}`;
    if (comment) text += `: "${comment}"`;
    return text;
  }

  if (log.action === "UPDATE") {
    const fields = meta.updatedFields as string[] | undefined;
    if (fields?.length) return `Felter: ${fields.join(", ")}`;
  }

  return null;
}

interface AuditLogListProps {
  logs: AuditLogWithActor[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Ingen historikk ennå.</p>;
  }

  return (
    <ol className="space-y-3">
      {logs.map((log, i) => {
        const detail = formatMetadata(log);
        return (
          <li key={log.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
              {i < logs.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            <div className="pb-3">
              <p className="font-medium">{actionLabels[log.action] ?? log.action}</p>
              <p className="text-muted-foreground text-xs">
                {log.actor.fullName} · {format(new Date(log.createdAt), "d. MMM yyyy, HH:mm", { locale: nb })}
              </p>
              {detail && <p className="text-muted-foreground text-xs mt-0.5">{detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
