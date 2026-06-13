import Link from "next/link";
import { FileText, BookOpen, Zap, CalendarDays, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

type TodoItem = {
  type: "action" | "incident" | "document" | "handbook" | "leave";
  id: string;
  title: string;
  description: string;
  href: string;
};

const TYPE_CONFIG = {
  document: { icon: FileText,    color: "text-blue-600",   bg: "bg-blue-50"   },
  handbook: { icon: BookOpen,    color: "text-amber-600",  bg: "bg-amber-50"  },
  action:   { icon: Zap,         color: "text-red-600",    bg: "bg-red-50"    },
  leave:    { icon: CalendarDays,color: "text-indigo-600", bg: "bg-indigo-50" },
  incident: { icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50" },
};

interface TodoSectionProps {
  items: TodoItem[];
}

export function TodoSection({ items }: TodoSectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Må gjøres</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm font-medium">Ingen åpne oppgaver akkurat nå</p>
          <p className="text-xs text-muted-foreground">Du er à jour — bra jobbet!</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card divide-y overflow-hidden">
          {items.map((item) => {
            const { icon: Icon, color, bg } = TYPE_CONFIG[item.type];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors min-h-[56px]"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
