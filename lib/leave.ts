import type { LeaveRequestType, LeaveRequestStatus } from "@prisma/client";

export const LEAVE_TYPE_LABELS: Record<LeaveRequestType, string> = {
  VACATION: "Ferie",
  SICK_LEAVE: "Sykemelding",
  CARE_LEAVE: "Omsorgsfravær",
  EGENMELDING: "Egenmelding",
  PARENTAL_LEAVE: "Foreldrepermisjon",
  UNPAID_LEAVE: "Permisjon uten lønn",
  OTHER: "Annet fravær",
};

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: "Til behandling",
  APPROVED: "Godkjent",
  REJECTED: "Avslått",
  CANCELLED: "Kansellert",
};

export const LEAVE_STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-primary/15 text-primary",
  REJECTED: "bg-destructive/15 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export const LEAVE_TYPE_COLORS: Record<LeaveRequestType, string> = {
  VACATION: "bg-primary/15 text-primary",
  SICK_LEAVE: "bg-accent/15 text-accent-foreground",
  CARE_LEAVE: "bg-muted text-muted-foreground",
  EGENMELDING: "bg-accent/10 text-accent-foreground",
  PARENTAL_LEAVE: "bg-primary/10 text-primary",
  UNPAID_LEAVE: "bg-muted text-muted-foreground",
  OTHER: "bg-muted text-muted-foreground",
};

export function requiresReason(type: LeaveRequestType) {
  return type === "OTHER" || type === "UNPAID_LEAVE";
}

export const LEAVE_TYPE_CALENDAR_COLORS: Record<LeaveRequestType, string> = {
  VACATION: "bg-blue-500",
  SICK_LEAVE: "bg-orange-500",
  CARE_LEAVE: "bg-purple-500",
  EGENMELDING: "bg-teal-500",
  PARENTAL_LEAVE: "bg-pink-500",
  UNPAID_LEAVE: "bg-slate-500",
  OTHER: "bg-gray-500",
};

// Returns a week grid for a given month. Each row is Mon-Sun.
// Days outside the target month are included to fill the grid.
export function buildMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Mon=0 … Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;

  const cells: Date[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(new Date(year, month - 1, 1 - startDow + i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateInRange(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() &&
    d <= new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
}

export const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

export const WEEKDAY_NAMES = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
