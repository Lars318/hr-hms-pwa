import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { createAdminClient } from "@/lib/supabase/admin";

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  title: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  dateOfBirth: z.string().optional().nullable(),
  probationEndsAt: z.string().optional().nullable(),
  employedAt: z.string().optional(),
  terminatedAt: z.string().optional().nullable(),
});

export const profileRouter = router({
  // Innlogget bruker henter sin egen profil
  me: profileProcedure.query(({ ctx }) => ctx.profile),

  // Alle innloggede: ansattkatalog (kun trygge felter, kun aktive)
  directory: profileProcedure
    .input(
      z.object({
        search: z.string().optional(),
        locationId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, locationId } = input;
      return ctx.db.profile.findMany({
        where: {
          status: "ACTIVE",
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { title: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(locationId
            ? { profileAssignments: { some: { locationId, endDate: null } } }
            : {}),
        },
        select: {
          id: true,
          fullName: true,
          title: true,
          phone: true,
          email: true,
          avatarUrl: true,
          role: true,
          department: { select: { name: true } },
          profileAssignments: {
            where: { isPrimary: true, endDate: null },
            select: { location: { select: { id: true, name: true, city: true } } },
            take: 1,
          },
        },
        orderBy: { fullName: "asc" },
      });
    }),

  // Dev-only: hent alle profiler for testbruker-bytter (krever ENABLE_TEST_SWITCHER=true)
  devList: profileProcedure.query(async ({ ctx }) => {
    if (process.env.ENABLE_TEST_SWITCHER !== "true") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return ctx.db.profile.findMany({
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: "asc" },
    });
  }),

  // HR/ADMIN: hent alle profiler med søk og filter
  list: hrProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        departmentId: z.string().optional(),
        locationId: z.string().optional(),
        title: z.string().optional(),
        employmentType: z.enum(["EMPLOYEE", "SELF_EMPLOYED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, departmentId, locationId, title, employmentType } = input;
      return ctx.db.profile.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          ...(departmentId ? { departmentId } : {}),
          ...(employmentType ? { employmentType } : {}),
          ...(title ? { title: { equals: title, mode: "insensitive" } } : {}),
          ...(locationId
            ? { profileAssignments: { some: { locationId, endDate: null } } }
            : {}),
        },
        include: {
          department: true,
          manager: { select: { id: true, fullName: true } },
          profileAssignments: {
            where: { isPrimary: true, endDate: null },
            include: { location: { select: { id: true, name: true, city: true } } },
            take: 1,
          },
          extraDepartments: {
            include: { department: { select: { id: true, name: true } } },
          },
        },
        orderBy: { fullName: "asc" },
      });
    }),

  // HR/ADMIN: masse-endring av flere ansatte samtidig.
  bulkUpdate: hrProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(500),
        departmentId: z.string().optional(), // primær avdeling
        addDepartmentId: z.string().optional(), // tilleggsavdeling
        locationId: z.string().optional(), // primær lokasjon
        role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        title: z.string().max(120).optional(),
        employmentType: z.enum(["EMPLOYEE", "SELF_EMPLOYED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ids, departmentId, addDepartmentId, locationId, role, status, title, employmentType } = input;

      // 1) Direkte Profile-felter (primær avdeling, rolle, status, tittel).
      const profileData: Record<string, unknown> = {};
      if (departmentId !== undefined) profileData.departmentId = departmentId || null;
      if (role) profileData.role = role;
      if (status) profileData.status = status;
      if (title !== undefined && title.trim()) profileData.title = title.trim();
      if (employmentType) profileData.employmentType = employmentType;
      if (Object.keys(profileData).length > 0) {
        await ctx.db.profile.updateMany({ where: { id: { in: ids } }, data: profileData });
      }

      // 2) Tilleggsavdeling — opprett kobling for hver (hopper over duplikater).
      if (addDepartmentId) {
        await ctx.db.profileDepartment.createMany({
          data: ids.map((profileId) => ({ profileId, departmentId: addDepartmentId })),
          skipDuplicates: true,
        });
      }

      // 3) Primær lokasjon — oppdater eksisterende primær-tilknytning, ellers opprett.
      if (locationId) {
        for (const profileId of ids) {
          const primary = await ctx.db.profileAssignment.findFirst({
            where: { profileId, isPrimary: true, endDate: null },
            select: { id: true },
          });
          if (primary) {
            await ctx.db.profileAssignment.update({ where: { id: primary.id }, data: { locationId } });
          } else {
            await ctx.db.profileAssignment.create({
              data: { profileId, locationId, isPrimary: true },
            });
          }
        }
      }

      await ctx.db.auditLog.create({
        data: {
          entityType: "Profile",
          entityId: "bulk-update",
          action: "PROFILE_BULK_UPDATE",
          actorId: ctx.profile.id,
          metadata: {
            count: ids.length,
            fields: { departmentId, addDepartmentId, locationId, role, status },
          },
        },
      });

      return { count: ids.length };
    }),

  // HR/ADMIN: hent én profil
  byId: hrProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { id: input.id },
        include: { department: true, manager: { select: { id: true, fullName: true } } },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Ansatt ikke funnet." });
      return profile;
    }),

  // HR/ADMIN: opprett profil (for ansatte uten Supabase-bruker ennå)
  create: hrProcedure
    .input(
      z.object({
        supabaseUserId: z.string().min(1, "Supabase bruker-ID er påkrevd"),
        email: z.string().email("Ugyldig e-postadresse"),
        fullName: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
        title: z.string().max(100).optional(),
        phone: z.string().max(30).optional(),
        departmentId: z.string().optional(),
        role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.profile.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "E-postadressen er allerede i bruk." });
      }
      return ctx.db.profile.create({ data: input, include: { department: true } });
    }),

  // HR/ADMIN: oppdater hvilken som helst profil
  adminUpdate: hrProcedure
    .input(z.object({ id: z.string() }).merge(profileUpdateSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, dateOfBirth, probationEndsAt, employedAt, terminatedAt, ...rest } = input;
      const exists = await ctx.db.profile.findUnique({ where: { id } });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Ansatt ikke funnet." });
      return ctx.db.profile.update({
        where: { id },
        data: {
          ...rest,
          ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
          ...(probationEndsAt !== undefined ? { probationEndsAt: probationEndsAt ? new Date(probationEndsAt) : null } : {}),
          ...(employedAt ? { employedAt: new Date(employedAt) } : {}),
          ...(terminatedAt !== undefined ? { terminatedAt: terminatedAt ? new Date(terminatedAt) : null } : {}),
        },
        include: { department: true, manager: { select: { id: true, fullName: true } } },
      });
    }),

  // Innlogget bruker oppdaterer seg selv (begrenset felt)
  update: profileProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100).optional(),
        phone: z.string().max(30).optional().nullable(),
        title: z.string().max(100).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.profile.update({
        where: { id: ctx.profile.id },
        data: input,
      });
    }),

  // Bulk-import av ansatte fra CSV (engangsmigrering). Oppretter auth-bruker
  // + profil per rad. Eksisterende e-poster hoppes over. Avdelinger matches på
  // navn (opprettes hvis de mangler). Ansatte setter eget passord via
  // "glemt passord" senere — vi setter et tilfeldig midlertidig passord.
  bulkImport: hrProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              email: z.string().email().max(200),
              fullName: z.string().min(2).max(120),
              employeeNumber: z.string().max(40).optional().nullable(),
              title: z.string().max(120).optional().nullable(),
              phone: z.string().max(40).optional().nullable(),
              departmentName: z.string().max(120).optional().nullable(),
              role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
              dateOfBirth: z.string().optional().nullable(),
            })
          )
          .min(1)
          .max(1000),
        updateExisting: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = createAdminClient();
      const results: { email: string; status: "created" | "updated" | "skipped" | "error"; message?: string }[] = [];
      const deptCache = new Map<string, string>(); // navn(lowercase) -> id

      async function resolveDepartmentId(name?: string | null): Promise<string | undefined> {
        const trimmed = name?.trim();
        if (!trimmed) return undefined;
        const key = trimmed.toLowerCase();
        const cached = deptCache.get(key);
        if (cached) return cached;
        const existing = await ctx.db.department.findFirst({
          where: { name: { equals: trimmed, mode: "insensitive" } },
          select: { id: true },
        });
        const id = existing?.id ?? (await ctx.db.department.create({ data: { name: trimmed } })).id;
        deptCache.set(key, id);
        return id;
      }

      for (const row of input.rows) {
        const email = row.email.trim().toLowerCase();
        try {
          const departmentId = await resolveDepartmentId(row.departmentName);
          const rawDob = row.dateOfBirth?.trim() ? new Date(row.dateOfBirth) : null;
          const dob = rawDob && !isNaN(rawDob.getTime()) ? rawDob : null;

          const existing = await ctx.db.profile.findUnique({
            where: { email },
            select: {
              id: true, fullName: true, employeeNumber: true, title: true,
              phone: true, departmentId: true, dateOfBirth: true, role: true,
            },
          });

          if (existing) {
            if (!input.updateExisting) {
              results.push({ email, status: "skipped", message: "Finnes allerede" });
              continue;
            }
            // Oppdater kun felter som faktisk har endret seg (tomme felter i
            // importen rører ikke eksisterende verdier).
            const data: Record<string, unknown> = {};
            const newName = row.fullName.trim();
            if (newName && newName !== existing.fullName) data.fullName = newName;
            const en = row.employeeNumber?.trim();
            if (en && en !== existing.employeeNumber) data.employeeNumber = en;
            const t = row.title?.trim();
            if (t && t !== existing.title) data.title = t;
            const ph = row.phone?.trim();
            if (ph && ph !== existing.phone) data.phone = ph;
            if (departmentId && departmentId !== existing.departmentId) data.departmentId = departmentId;
            if (dob && (!existing.dateOfBirth || dob.getTime() !== existing.dateOfBirth.getTime())) data.dateOfBirth = dob;
            if (row.role && row.role !== existing.role) data.role = row.role;

            if (Object.keys(data).length === 0) {
              results.push({ email, status: "skipped", message: "Uendret" });
              continue;
            }
            await ctx.db.profile.update({ where: { id: existing.id }, data });
            results.push({ email, status: "updated" });
            continue;
          }

          // Opprett auth-bruker (bekreftet e-post, tilfeldig passord).
          const { data: created, error: authErr } = await admin.auth.admin.createUser({
            email,
            password: randomUUID() + randomUUID(),
            email_confirm: true,
          });
          if (authErr || !created?.user) {
            results.push({ email, status: "error", message: authErr?.message ?? "Kunne ikke opprette innlogging" });
            continue;
          }

          try {
            await ctx.db.profile.create({
              data: {
                supabaseUserId: created.user.id,
                email,
                fullName: row.fullName.trim(),
                employeeNumber: row.employeeNumber?.trim() || null,
                title: row.title?.trim() || null,
                phone: row.phone?.trim() || null,
                role: row.role ?? "EMPLOYEE",
                departmentId: departmentId ?? null,
                dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : null,
              },
            });
            results.push({ email, status: "created" });
          } catch (profileErr) {
            // Rull tilbake auth-brukeren hvis profilen feiler.
            await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
            results.push({
              email,
              status: "error",
              message: profileErr instanceof Error ? profileErr.message : "Kunne ikke opprette profil",
            });
          }
        } catch (e) {
          results.push({ email, status: "error", message: e instanceof Error ? e.message : "Ukjent feil" });
        }
      }

      const summary = {
        created: results.filter((r) => r.status === "created").length,
        updated: results.filter((r) => r.status === "updated").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
      };

      await ctx.db.auditLog.create({
        data: {
          entityType: "Profile",
          entityId: "bulk-import",
          action: "PROFILE_BULK_IMPORT",
          actorId: ctx.profile.id,
          metadata: summary,
        },
      });

      return { results, summary };
    }),
});
