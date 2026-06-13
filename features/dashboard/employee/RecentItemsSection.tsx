import Link from "next/link";
import { ShieldAlert, Zap, CalendarDays, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

type RecentIncident = { id: string; title: string; status: string; severity: string; createdAt: Date };
type RecentAction   = { id: string; title: string; status: string; priority: string; dueDate: Date | null };
type RecentLeave    = { id: string; type: string; status: string; startDate: Date; endDate: Date };

interface RecentItemsSectionProps {
  incidents: RecentIncident[];
  actions:   RecentAction[];
  leave:     RecentLeave[];
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED:    "bg-green-100 text-green-800",
  CLOSED:      "bg-muted text-muted-foreground",
  PENDING:     "bg-yellow-100 text-yellow-800",
  APPROVED:    "bg-green-100 text-green-800",
  REJECTED:    "bg-red-100 text-red-800",
  CANCELLED:   "bg-muted text-muted-foreground",
  DONE:        "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Åpen", IN_PROGRESS: "Under arbeid", RESOLVED: "Løst", CLOSED: "Lukket",
  PENDING: "Venter", APPROVED: "Godkjent", REJECTED: "Avvist", CANCELLED: "Kansellert",
  DONE: "Ferdig",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: "Ferie", SICK_LEAVE: "Sykdom", CARE_LEAVE: "Omsorg",
  PARENTAL_LEAVE: "Foreldreperm.", UNPAID_LEAVE: "Ubetalt", OTHER: "Annet",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0", STATUS_COLORS[status] ?? "bg-muted text-muted-foreground")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SectionHeader({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <Link href={href} className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
    </div>
  );
}

export function RecentItemsSection({ incidents, actions, leave }: RecentItemsSectionProps) {
  const hasAny = incidents.length > 0 || actions.length > 0 || leave.length > 0;

  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mine siste saker</h2>

      <div className="space-y-3">
        {incidents.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <SectionHeader icon={ShieldAlert} label="Avvik" href="/avvik" />
            <div className="divide-y">
              {incidents.map((i) => (
                <Link key={i.id} href={`/avvik/${i.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[52px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(i.createdAt), "d. MMM yyyy", { locale: nb })}</p>
                  </div>
                  <Badge status={i.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {actions.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <SectionHeader icon={Zap} label="Tiltak" href="/tiltak" />
            <div className="divide-y">
              {actions.map((a) => (
                <Link key={a.id} href={`/tiltak/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[52px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.dueDate ? `Frist: ${format(new Date(a.dueDate), "d. MMM", { locale: nb })}` : "Ingen frist"}
                    </p>
                  </div>
                  <Badge status={a.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {leave.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <SectionHeader icon={CalendarDays} label="Fravær" href="/fravaer" />
            <div className="divide-y">
              {leave.map((l) => (
                <Link key={l.id} href="/fravaer" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors min-h-[52px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{LEAVE_TYPE_LABELS[l.type] ?? l.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(l.startDate), "d. MMM", { locale: nb })} – {format(new Date(l.endDate), "d. MMM yyyy", { locale: nb })}
                    </p>
                  </div>
                  <Badge status={l.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
