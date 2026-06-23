import type {
  FinancialContractType,
  FinancialContractStatus,
} from "@prisma/client";

export const TYPE_LABELS: Record<FinancialContractType, string> = {
  RENT: "Leie",
  LEASE: "Leasing",
  HUSLEIE: "Husleie",
  SERVICE_AGREEMENT: "Serviceavtale",
  SUBSCRIPTION: "Abonnement",
  INSURANCE: "Forsikring",
  SUPPLIER: "Leverandør",
  OTHER: "Annet",
};

export const STATUS_LABELS: Record<FinancialContractStatus, string> = {
  ACTIVE: "Aktiv",
  EXPIRES_SOON: "Utløper snart",
  EXPIRED: "Utløpt",
  TERMINATED: "Avsluttet",
  DRAFT: "Utkast",
};

// Badge-stiler per status (Tailwind).
export const STATUS_BADGE: Record<FinancialContractStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  EXPIRES_SOON: "bg-orange-100 text-orange-800 border-orange-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  TERMINATED: "bg-muted text-muted-foreground border-border",
  DRAFT: "bg-blue-100 text-blue-800 border-blue-200",
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [
  FinancialContractType,
  string
][];

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [
  FinancialContractStatus,
  string
][];

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Des",
];

export function formatNOK(value?: number | null): string {
  if (value == null) return "–";
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "–";
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
