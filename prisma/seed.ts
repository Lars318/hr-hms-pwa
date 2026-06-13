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

  // ── Lokasjoner ────────────────────────────────────────────────────────────
  const locationSki = await db.location.upsert({
    where: { name: "Treningssenter Ski" },
    update: {},
    create: {
      name: "Treningssenter Ski",
      address: "Idrettsveien 1",
      city: "Ski",
      organizationName: "PulsFollo AS",
    },
  });

  const locationVestby = await db.location.upsert({
    where: { name: "Treningssenter Vestby" },
    update: {},
    create: {
      name: "Treningssenter Vestby",
      address: "Sportsgata 5",
      city: "Vestby",
      organizationName: "PulsFollo AS",
    },
  });
  console.log("✓ Lokasjoner: Ski, Vestby");

  // ── Avdelinger per lokasjon ───────────────────────────────────────────────
  const skiDepts: Record<string, Awaited<ReturnType<typeof db.department.create>>> = {};
  const vestbyDepts: Record<string, Awaited<ReturnType<typeof db.department.create>>> = {};
  const deptNames = ["Resepsjon", "PT", "Gruppeinstruktør", "Renhold"];

  for (const deptName of deptNames) {
    skiDepts[deptName] = await db.department.create({
      data: { name: deptName, locationId: locationSki.id },
    });
    vestbyDepts[deptName] = await db.department.create({
      data: { name: deptName, locationId: locationVestby.id },
    });
  }

  // Behold eksisterende avdeling for bakoverkompatibilitet
  const legacyDept = await db.department.upsert({
    where: { id: "legacy-it" },
    update: {},
    create: { id: "legacy-it", name: "IT og utvikling" },
  }).catch(() =>
    db.department.findFirst({ where: { name: "IT og utvikling" } }).then((d) => d!)
  );

  console.log("✓ Avdelinger: 4 per lokasjon + legacy");

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
    },
  });

  const hms = await db.profile.upsert({
    where: { email: "hms@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.hms,
      email: "hms@test.no",
      fullName: "HMS Testesen",
      title: "HMS-ansvarlig",
      role: "HR",
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
      departmentId: skiDepts["Resepsjon"].id,
    },
  });

  const employee1 = await db.profile.upsert({
    where: { email: "employee1@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.employee1,
      email: "employee1@test.no",
      fullName: "Ansatt En Testesen",
      title: "Resepsjonist",
      role: "EMPLOYEE",
      departmentId: skiDepts["Resepsjon"].id,
    },
  });

  const employee2 = await db.profile.upsert({
    where: { email: "employee2@test.no" },
    update: {},
    create: {
      supabaseUserId: SUPABASE_USER_IDS.employee2,
      email: "employee2@test.no",
      fullName: "Ansatt To Testesen",
      title: "Personal Trainer",
      role: "EMPLOYEE",
      departmentId: vestbyDepts["PT"].id,
    },
  });
  console.log("✓ Brukere: ADMIN, HR, HMS, MANAGER, EMPLOYEE x2");

  // ── Verneombud og HMS-ansvarlig ───────────────────────────────────────────
  await db.location.update({
    where: { id: locationSki.id },
    data: {
      safetyRepresentativeId: employee1.id,
      hseManagerId: hms.id,
    },
  });

  await db.location.update({
    where: { id: locationVestby.id },
    data: {
      safetyRepresentativeId: employee2.id,
      hseManagerId: hms.id,
    },
  });
  console.log("✓ Verneombud: employee1 (Ski), employee2 (Vestby)");

  // ── ProfileAssignments ────────────────────────────────────────────────────
  await db.profileAssignment.createMany({
    data: [
      // employee1: primær Ski/Resepsjon + ekstra Ski/Gruppeinstruktør
      {
        profileId: employee1.id,
        locationId: locationSki.id,
        departmentId: skiDepts["Resepsjon"].id,
        roleLabel: "Resepsjonist",
        isPrimary: true,
        startDate: new Date("2024-01-15"),
      },
      {
        profileId: employee1.id,
        locationId: locationSki.id,
        departmentId: skiDepts["Gruppeinstruktør"].id,
        roleLabel: "Gruppeinstruktør",
        isPrimary: false,
        startDate: new Date("2024-03-01"),
      },
      // employee2: primær Vestby/PT
      {
        profileId: employee2.id,
        locationId: locationVestby.id,
        departmentId: vestbyDepts["PT"].id,
        roleLabel: "Personal Trainer",
        isPrimary: true,
        startDate: new Date("2024-02-01"),
      },
      // manager: Ski
      {
        profileId: manager.id,
        locationId: locationSki.id,
        departmentId: skiDepts["Resepsjon"].id,
        roleLabel: "Avdelingsleder",
        isPrimary: true,
        startDate: new Date("2023-06-01"),
      },
      // hms: HMS-ansvarlig begge
      {
        profileId: hms.id,
        locationId: locationSki.id,
        roleLabel: "HMS-ansvarlig",
        isPrimary: true,
        startDate: new Date("2023-01-01"),
      },
      {
        profileId: hms.id,
        locationId: locationVestby.id,
        roleLabel: "HMS-ansvarlig",
        isPrimary: false,
        startDate: new Date("2023-01-01"),
      },
    ],
  });
  console.log("✓ ProfileAssignments: opprettet");

  // ── Avvik ─────────────────────────────────────────────────────────────────
  const incident1 = await db.incident.create({
    data: {
      title: "Glatt gulv i inngangsparti",
      description: "Gulvet i inngangspartiet var svært glatt etter regn. En ansatt nesten falt.",
      severity: "MEDIUM",
      status: "OPEN",
      reportedById: employee1.id,
      departmentId: skiDepts["Resepsjon"].id,
      locationId: locationSki.id,
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const incident2 = await db.incident.create({
    data: {
      title: "Defekt tredemølle",
      description: "Tredemølle nr. 3 har ujevnt belte og stopper plutselig. Fare for fall.",
      severity: "HIGH",
      status: "IN_PROGRESS",
      reportedById: employee2.id,
      assignedToId: manager.id,
      departmentId: vestbyDepts["PT"].id,
      locationId: locationVestby.id,
      occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Avvik: 2 stk (ett per lokasjon)");

  // ── Tiltak ────────────────────────────────────────────────────────────────
  await db.action.create({
    data: {
      title: "Legg sklisikker matte i inngang",
      description: "Kjøp inn sklisikker matte til inngangspartiet",
      status: "OPEN",
      priority: "MEDIUM",
      assignedToId: manager.id,
      departmentId: skiDepts["Resepsjon"].id,
      locationId: locationSki.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sourceType: "INCIDENT",
      sourceId: incident1.id,
    },
  });

  await db.action.create({
    data: {
      title: "Servicekall tredemølle nr. 3",
      description: "Kontakt leverandør for umiddelbar service av defekt tredemølle",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedToId: employee2.id,
      departmentId: vestbyDepts["PT"].id,
      locationId: locationVestby.id,
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
      departmentId: skiDepts["Resepsjon"].id,
      locationId: locationSki.id,
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
      departmentId: skiDepts["Resepsjon"].id,
      locationId: locationSki.id,
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
