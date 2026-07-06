import { CheckCircle2, Circle, Mail, FileSignature, ClipboardCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStatus {
  invited: boolean;
  contractSigned: boolean;
  selfDeclaration: boolean;
  handbookRead: boolean;
  isSelfEmployed: boolean;
}

const ICONS = { invited: Mail, contract: FileSignature, selfDecl: ClipboardCheck, handbook: BookOpen };

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const items = [
    { key: "invited", label: "Invitert til appen", done: status.invited, icon: ICONS.invited },
    {
      key: "contract",
      label: status.isSelfEmployed ? "Oppdragsavtale signert" : "Arbeidskontrakt signert",
      done: status.contractSigned,
      icon: ICONS.contract,
    },
    { key: "selfDecl", label: "Egenerklæring mottatt", done: status.selfDeclaration, icon: ICONS.selfDecl },
    ...(status.isSelfEmployed
      ? []
      : [{ key: "handbook", label: "Personalhåndbok lest", done: status.handbookRead, icon: ICONS.handbook }]),
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Onboarding</h3>
        <span className={cn("text-xs font-medium", allDone ? "text-emerald-600" : "text-muted-foreground")}>
          {doneCount} av {total} fullført
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", allDone ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex items-center gap-2.5 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className={cn(item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
