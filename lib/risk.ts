import type { RiskAssessmentStatus, RiskItemStatus, RiskLevel, ActionStatus, ActionPriority } from "@prisma/client";

export const ASSESSMENT_STATUS_LABELS: Record<RiskAssessmentStatus, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  REVIEW: "Til gjennomgang",
  CLOSED: "Lukket",
};

export const RISK_ITEM_STATUS_LABELS: Record<RiskItemStatus, string> = {
  OPEN: "Åpen",
  IN_PROGRESS: "Pågår",
  RESOLVED: "Løst",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Lav",
  MEDIUM: "Middels",
  HIGH: "Høy",
  CRITICAL: "Kritisk",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  OPEN: "Åpen",
  IN_PROGRESS: "Pågår",
  DONE: "Fullført",
  CANCELLED: "Avbrutt",
};

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  LOW: "Lav",
  MEDIUM: "Middels",
  HIGH: "Høy",
  CRITICAL: "Kritisk",
};

export function calcRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function calcRiskLevel(score: number): RiskLevel {
  if (score <= 4) return "LOW";
  if (score <= 9) return "MEDIUM";
  if (score <= 16) return "HIGH";
  return "CRITICAL";
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const ACTION_PRIORITY_COLORS: Record<ActionPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const ACTION_STATUS_COLORS: Record<ActionStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};
