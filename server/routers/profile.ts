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
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, departmentId, locationId } = input;
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
        },
        orderBy: { fullName: "asc" },
      });
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = createAdminClient();
      const results: { email: string; status: "created" | "skipped" | "error"; message?: string }[] = [];
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
          const existing = await ctx.db.profile.findUnique({ where: { email }, select: { id: true } });
          if (existing) {
            results.push({ email, status: "skipped", message: "Finnes allerede" });
            continue;
          }

          const departmentId = await resolveDepartmentId(row.departmentName);

          const dob = row.dateOfBirth?.trim() ? new Date(row.dateOfBirth) : null;

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
