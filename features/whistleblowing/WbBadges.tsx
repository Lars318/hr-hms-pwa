import type { WhistleblowingStatus, WhistleblowingSeverity, WhistleblowingCategory } from "@prisma/client";

const STATUS_MAP: Record<WhistleblowingStatus, { label: string; cls: string }> = {
  RECEIVED:         { label: "Mottatt",         cls: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW:     { label: "Under vurdering", cls: "bg-yellow-100 text-yellow-700" },
  INVESTIGATING:    { label: "Undersøkes",       cls: "bg-orange-100 text-orange-700" },
  ACTION_REQUIRED:  { label: "Tiltak kreves",    cls: "bg-red-100 text-red-700" },
  CLOSED:           { label: "Lukket",           cls: "bg-green-100 text-green-700" },
  REJECTED:         { label: "Avvist",           cls: "bg-muted text-muted-foreground" },
};

const SEVERITY_MAP: Record<WhistleblowingSeverity, { label: string; cls: string }> = {
  LOW:      { label: "Lav",     cls: "bg-green-100 text-green-700" },
  MEDIUM:   { label: "Medium",  cls: "bg-yellow-100 text-yellow-700" },
  HIGH:     { label: "Høy",     cls: "bg-orange-100 text-orange-700" },
  CRITICAL: { label: "Kritisk", cls: "bg-red-100 text-red-700" },
};

const CATEGORY_MAP: Record<WhistleblowingCategory, string> = {
  HARASSMENT:           "Trakassering",
  DISCRIMINATION:       "Diskriminering",
  SAFETY:               "Sikkerhetsbrudd / HMS",
  FINANCIAL_MISCONDUCT: "Økonomiske misligheter",
  ETHICS:               "Uetisk atferd",
  RETALIATION:          "Gjengjeldelse",
  OTHER:                "Annet",
};

export function WbStatusBadge({ status }: { status: WhistleblowingStatus }) {
  const { label, cls } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function WbSeverityBadge({ severity }: { severity: WhistleblowingSeverity }) {
  const { label, cls } = SEVERITY_MAP[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function WbCategoryLabel({ category }: { category: WhistleblowingCategory }) {
  return <>{CATEGORY_MAP[category]}</>;
}
