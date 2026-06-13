import type { PrismaClient } from "@prisma/client";
import { fmtDate } from "./csv";

// ── Label maps ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Lav", MEDIUM: "Middels", HIGH: "Høy", CRITICAL: "Kritisk",
};
const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Åpen", IN_PROGRESS: "Pågår", RESOLVED: "Løst", CLOSED: "Lukket",
};
const ACTION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Åpen", IN_PROGRESS: "Pågår", DONE: "Fullført", CANCELLED: "Kansellert",
};
const ACTION_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Lav", MEDIUM: "Middels", HIGH: "Høy", CRITICAL: "Kritisk",
};
const RISK_LEVEL_LABELS: Record<string, string> = {
  LOW: "Lav", MEDIUM: "Middels", HIGH: "Høy", CRITICAL: "Kritisk",
};
const RISK_ITEM_STATUS_LABELS: Record<string, string> = {
  OPEN: "Åpen", IN_PROGRESS: "Pågår", RESOLVED: "Løst",
};
const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: "Ferie",
  SICK_LEAVE: "Sykemelding",
  CARE_LEAVE: "Omsorgspermisjon",
  PARENTAL_LEAVE: "Foreldrepermisjon",
  UNPAID_LEAVE: "Permisjon uten lønn",
  OTHER: "Annet fravær",
};
const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Til behandling",
  APPROVED: "Godkjent",
  REJECTED: "Avslått",
  CANCELLED: "Kansellert",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportInput {
  from?: string;
  to?: string;
  departmentId?: string;
  locationId?: string;
}

export interface ReportData {
  headers: string[];
  rows: (string | number | null)[][];
  total: number;
}

// Profile shape needed by queries
interface ReportProfile {
  id: string;
  role: string;
  departmentId: string | null;
}

// ── RBAC helpers ──────────────────────────────────────────────────────────────

function isHrAdmin(profile: ReportProfile) {
  return profile.role === "ADMIN" || profile.role === "HR";
}

function resolvedDeptId(profile: ReportProfile, requested?: string): string | undefined {
  if (isHrAdmin(profile)) return requested || undefined;
  // MANAGER: force own department
  return profile.departmentId ?? undefined;
}

function dateWhere(field: string, from?: string, to?: string) {
  const range: Record<string, Date> = {};
  if (from) range["gte"] = new Date(from);
  if (to) range["lte"] = new Date(to + "T23:59:59.999Z");
  return Object.keys(range).length > 0 ? { [field]: range } : {};
}

// ── Incidents ─────────────────────────────────────────────────────────────────

export async function queryIncidents(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const deptId = resolvedDeptId(profile, input.departmentId);
  const locId = isHrAdmin(profile) ? input.locationId : undefined;

  const rows = await db.incident.findMany({
    where: {
      ...dateWhere("createdAt", input.from, input.to),
      ...(locId ? { locationId: locId } : {}),
      ...(deptId ? { departmentId: deptId } : {}),
      ...(!isHrAdmin(profile) && !deptId
        ? { reportedById: profile.id }
        : {}),
    },
    include: {
      reportedBy: { select: { fullName: true } },
      assignedTo: { select: { fullName: true } },
      department: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Dato", "Tittel", "Status", "Alvorlighetsgrad",
    "Lokasjon", "Avdeling", "Rapportert av", "Ansvarlig", "Frist",
  ];
  const data = rows.map((r) => [
    fmtDate(r.createdAt),
    r.title,
    INCIDENT_STATUS_LABELS[r.status] ?? r.status,
    SEVERITY_LABELS[r.severity] ?? r.severity,
    r.location?.name ?? "",
    r.department?.name ?? "",
    r.reportedBy.fullName,
    r.assignedTo?.fullName ?? "",
    fmtDate(r.dueDate),
  ] as (string | null)[]);

  return { headers, rows: data, total: rows.length };
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function queryActions(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const deptId = resolvedDeptId(profile, input.departmentId);
  const locId = isHrAdmin(profile) ? input.locationId : undefined;

  const rows = await db.action.findMany({
    where: {
      ...dateWhere("createdAt", input.from, input.to),
      ...(locId ? { locationId: locId } : {}),
      ...(deptId ? { departmentId: deptId } : {}),
      ...(!isHrAdmin(profile) && !deptId
        ? { assignedToId: profile.id }
        : {}),
    },
    include: {
      assignedTo: { select: { fullName: true } },
      department: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Dato", "Tittel", "Status", "Prioritet",
    "Lokasjon", "Avdeling", "Ansvarlig", "Frist", "Fullført dato",
  ];
  const data = rows.map((r) => [
    fmtDate(r.createdAt),
    r.title,
    ACTION_STATUS_LABELS[r.status] ?? r.status,
    ACTION_PRIORITY_LABELS[r.priority] ?? r.priority,
    r.location?.name ?? "",
    r.department?.name ?? "",
    r.assignedTo?.fullName ?? "",
    fmtDate(r.dueDate),
    fmtDate(r.completedAt),
  ] as (string | null)[]);

  return { headers, rows: data, total: rows.length };
}

// ── Risk items ────────────────────────────────────────────────────────────────

export async function queryRisk(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const deptId = resolvedDeptId(profile, input.departmentId);

  const rows = await db.riskItem.findMany({
    where: {
      ...dateWhere("createdAt", input.from, input.to),
      assessment: {
        ...(deptId ? { departmentId: deptId } : {}),
        ...(!isHrAdmin(profile) && !deptId && profile.departmentId
          ? { departmentId: profile.departmentId }
          : {}),
      },
    },
    include: {
      assessment: { select: { title: true, department: { select: { name: true } } } },
      responsible: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Risikovurdering", "Avdeling", "Fare", "Konsekvens",
    "Sannsynlighet", "Konsekvensgrad", "Risikoscore", "Risikonivå",
    "Status", "Ansvarlig", "Frist",
  ];
  const data = rows.map((r) => [
    r.assessment.title,
    r.assessment.department?.name ?? "",
    r.hazard,
    r.consequence,
    r.likelihood,
    r.impact,
    r.riskScore,
    RISK_LEVEL_LABELS[r.riskLevel] ?? r.riskLevel,
    RISK_ITEM_STATUS_LABELS[r.status] ?? r.status,
    r.responsible?.fullName ?? "",
    fmtDate(r.dueDate),
  ] as (string | number | null)[]);

  return { headers, rows: data, total: rows.length };
}

// ── Document read confirmations ───────────────────────────────────────────────

export async function queryDocuments(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const deptId = resolvedDeptId(profile, input.departmentId);

  const rows = await db.documentReadConfirmation.findMany({
    where: {
      ...dateWhere("confirmedAt", input.from, input.to),
      ...(deptId
        ? { profile: { departmentId: deptId } }
        : {}),
    },
    include: {
      document: { select: { title: true } },
      profile: {
        select: { fullName: true, department: { select: { name: true } } },
      },
    },
    orderBy: { confirmedAt: "desc" },
  });

  const headers = [
    "Dokument", "Versjon", "Ansatt", "Avdeling", "Bekreftet lest", "Dato",
  ];
  const data = rows.map((r) => [
    r.document.title,
    r.documentVersion,
    r.profile.fullName,
    r.profile.department?.name ?? "",
    "Ja",
    fmtDate(r.confirmedAt),
  ] as (string | number | null)[]);

  return { headers, rows: data, total: rows.length };
}

// ── Leave requests ────────────────────────────────────────────────────────────

export async function queryLeave(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const deptId = resolvedDeptId(profile, input.departmentId);
  const locId = isHrAdmin(profile) ? input.locationId : undefined;

  const rows = await db.leaveRequest.findMany({
    where: {
      ...dateWhere("startDate", input.from, input.to),
      ...(locId ? { locationId: locId } : {}),
      ...(deptId ? { departmentId: deptId } : {}),
      ...(!isHrAdmin(profile) && !deptId
        ? { employeeId: profile.id }
        : {}),
    },
    include: {
      employee: { select: { fullName: true } },
      department: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  const headers = [
    "Ansatt", "Lokasjon", "Avdeling", "Type", "Status",
    "Fra", "Til", "Dager",
  ];
  const data = rows.map((r) => [
    r.employee.fullName,
    r.location?.name ?? "",
    r.department?.name ?? "",
    LEAVE_TYPE_LABELS[r.type] ?? r.type,
    LEAVE_STATUS_LABELS[r.status] ?? r.status,
    fmtDate(r.startDate),
    fmtDate(r.endDate),
    r.days,
  ] as (string | number | null)[]);

  return { headers, rows: data, total: rows.length };
}

// ── Handbook read status ──────────────────────────────────────────────────────

export async function queryHandbook(
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  const latest = await db.handbookVersion.findFirst({
    orderBy: { version: "desc" },
    select: { id: true, version: true, publishedAt: true },
  });

  if (!latest) {
    return { headers: ["Ansatt", "Avdeling", "Status", "Versjon"], rows: [], total: 0 };
  }

  const deptId = isHrAdmin(profile) ? input.departmentId : undefined;

  const activeProfiles = await db.profile.findMany({
    where: {
      status: "ACTIVE",
      ...(deptId ? { departmentId: deptId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      department: { select: { name: true } },
      handbookAcknowledgements: {
        where: { versionId: latest.id },
        select: { acknowledgedAt: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const headers = ["Ansatt", "Avdeling", "Status", "Versjon", "Bekreftet dato"];
  const rows = activeProfiles.map((p) => {
    const ack = p.handbookAcknowledgements[0];
    return [
      p.fullName,
      p.department?.name ?? "",
      ack ? "Lest" : "Mangler",
      `v${latest.version}`,
      ack ? fmtDate(ack.acknowledgedAt) : "",
    ] as (string | null)[];
  });

  return { headers, rows, total: activeProfiles.length };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export type ReportType = "incidents" | "actions" | "risk" | "documents" | "leave" | "handbook";

export async function runReport(
  type: ReportType,
  db: PrismaClient,
  profile: ReportProfile,
  input: ReportInput
): Promise<ReportData> {
  switch (type) {
    case "incidents": return queryIncidents(db, profile, input);
    case "actions": return queryActions(db, profile, input);
    case "risk": return queryRisk(db, profile, input);
    case "documents": return queryDocuments(db, profile, input);
    case "leave": return queryLeave(db, profile, input);
    case "handbook": return queryHandbook(db, profile, input);
  }
}
