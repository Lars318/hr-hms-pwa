import { Info, CalendarDays, FileText, AlertTriangle, PartyPopper, type LucideIcon } from "lucide-react";

export interface AnnouncementCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Gradient + kantfarge for kortet. */
  card: string;
  /** Ikon-chip-farge. */
  chip: string;
}

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  { key: "INFO",        label: "Informasjon", icon: Info,          card: "from-blue-500/10 to-blue-500/5 border-blue-500/20",       chip: "bg-blue-100 text-blue-700" },
  { key: "EVENT",       label: "Arrangement", icon: CalendarDays,  card: "from-violet-500/10 to-violet-500/5 border-violet-500/20",  chip: "bg-violet-100 text-violet-700" },
  { key: "DOCUMENT",    label: "Dokument",    icon: FileText,      card: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20", chip: "bg-emerald-100 text-emerald-700" },
  { key: "ALERT",       label: "Viktig",      icon: AlertTriangle, card: "from-amber-500/10 to-amber-500/5 border-amber-500/20",     chip: "bg-amber-100 text-amber-700" },
  { key: "CELEBRATION", label: "Feiring",     icon: PartyPopper,   card: "from-rose-500/10 to-rose-500/5 border-rose-500/20",        chip: "bg-rose-100 text-rose-700" },
];

const DEFAULT = ANNOUNCEMENT_CATEGORIES[0];

export function categoryFor(key?: string | null): AnnouncementCategory {
  return ANNOUNCEMENT_CATEGORIES.find((c) => c.key === key) ?? DEFAULT;
}
