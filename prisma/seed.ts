import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SUPABASE_USER_IDS = {
  admin:     "4bb9b1eb-1808-4dc2-b690-ae7dc9030855",
  hr:        "662af606-57bb-4f39-9832-63babfd7c62b",
  hms:       "83fae480-b6d1-47db-860e-63c218325988",
  manager:   "064c670a-49ba-48b8-aecc-b4e01783b5ee",
  employee1: "9d5060cb-e6ab-43be-8c3d-5fed81fa037a",
  employee2: "e64f7d98-fc15-4fa1-82da-d57ed4658c02",
};

async function main() {
  console.log("🌱 Starter seed...");

  // ── Avdeling ──────────────────────────────────────────────────────────────
  const dept = await db.department.upsert({
    where: { name: "IT og utvikling" },
    update: {},
    create: { name: "IT og utvikling" },
  });
  console.log("✓ Avdeling:", dept.name);

  // ── Brukere ───────────────────────────────────────────────────────────────
  const admin = await db.profile.upsert({
    where: { email: "admin@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.admin,
      email: "admin@test.no",
      fullName: "Admin Testesen",
      title: "Systemadministrator",
      role: "ADMIN",
      departmentId: dept.id,
    },
  });

  const hr = await db.profile.upsert({
    where: { email: "hr@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.hr,
      email: "hr@test.no",
      fullName: "HR Testesen",
      title: "HR-sjef",
      role: "HR",
      departmentId: dept.id,
    },
  });

  await db.profile.upsert({
    where: { email: "hms@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.hms,
      email: "hms@test.no",
      fullName: "HMS Testesen",
      title: "HMS-ansvarlig",
      role: "HR",
      departmentId: dept.id,
    },
  });

  const manager = await db.profile.upsert({
    where: { email: "manager@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.manager,
      email: "manager@test.no",
      fullName: "Manager Testesen",
      title: "Avdelingsleder",
      role: "MANAGER",
      departmentId: dept.id,
    },
  });

  const employee1 = await db.profile.upsert({
    where: { email: "employee1@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.employee1,
      email: "employee1@test.no",
      fullName: "Ansatt En Testesen",
      title: "Utvikler",
      role: "EMPLOYEE",
      departmentId: dept.id,
    },
  });

  const employee2 = await db.profile.upsert({
    where: { email: "employee2@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.employee2,
      email: "employee2@test.no",
      fullName: "Ansatt To Testesen",
      title: "Utvikler",
      role: "EMPLOYEE",
      departmentId: dept.id,
    },
  });
  console.log("✓ Brukere: ADMIN, HR, HMS, MANAGER, EMPLOYEE x2");

  // ── Avvik ─────────────────────────────────────────────────────────────────
  const incident1 = await db.incident.create({
    data: {
      title: "Glatt gulv i inngangsparti",
      description: "Gulvet i inngangspartiet var svært glatt etter regn. En ansatt nesten falt.",
      severity: "MEDIUM",
      status: "OPEN",
      reportedById: employee2.id,
      departmentId: dept.id,
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const incident2 = await db.incident.create({
    data: {
      title: "Serverfeil i produksjon",
      description: "API-serveren krasjet kl. 09:15. Nedetid i 12 minutter. Rotårsak: OOM-feil.",
      severity: "HIGH",
      status: "IN_PROGRESS",
      reportedById: manager.id,
      assignedToId: admin.id,
      departmentId: dept.id,
      occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Avvik: 2 stk");

  // ── Tiltak ────────────────────────────────────────────────────────────────
  await db.action.create({
    data: {
      title: "Legg sklisikker matte i inngang",
      description: "Kjøp inn sklisikker matte til inngangspartiet",
      status: "OPEN",
      priority: "MEDIUM",
      assignedToId: manager.id,
      departmentId: dept.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sourceType: "INCIDENT",
      sourceId: incident1.id,
    },
  });

  await db.action.create({
    data: {
      title: "Øk RAM på produksjonsserver",
      description: "Bestill oppgradering av server-RAM fra 16 GB til 32 GB",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedToId: admin.id,
      departmentId: dept.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      sourceType: "INCIDENT",
      sourceId: incident2.id,
    },
  });
  console.log("✓ Tiltak: 2 stk");

  // ── Dokument ──────────────────────────────────────────────────────────────
  await db.document.create({
    data: {
      title: "HMS-håndbok 2024",
      description: "Gjeldende HMS-håndbok for alle ansatte",
      category: "HMS",
      visibility: "PUBLIC",
      version: 1,
      filePath: "documents/seed-placeholder/hms-handbok-2024.pdf",
      mimeType: "application/pdf",
      sizeBytes: 102400,
      ownerId: hr.id,
    },
  });
  console.log("✓ Dokument: 1 stk (placeholder — ingen faktisk fil i Storage)");

  // ── Fraværssøknader ───────────────────────────────────────────────────────
  await db.leaveRequest.create({
    data: {
      employeeId: employee1.id,
      departmentId: dept.id,
      type: "VACATION",
      status: "PENDING",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      days: 7,
    },
  });

  await db.leaveRequest.create({
    data: {
      employeeId: manager.id,
      departmentId: dept.id,
      type: "SICK_LEAVE",
      status: "APPROVED",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      days: 3,
      decidedById: hr.id,
      decidedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Fraværssøknader: 2 stk");

  console.log("\n✅ Seed fullført!");
}

main()
  .catch((e) => {
    console.error("❌ Seed feilet:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
