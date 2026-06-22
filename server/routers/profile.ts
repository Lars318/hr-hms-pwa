import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Navn må ha minst 2 tegn").max(100),
  title: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const profileRouter = router({
  // Innlogget bruker henter sin egen profil
  me: profileProcedure.query(({ ctx }) => ctx.profile),

  // HR/ADMIN: hent alle profiler med søk og filter
  list: hrProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        departmentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, departmentId } = input;
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
        },
        include: { department: true, manager: { select: { id: true, fullName: true } } },
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
      const { id, ...data } = input;
      const exists = await ctx.db.profile.findUnique({ where: { id } });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Ansatt ikke funnet." });
      return ctx.db.profile.update({
        where: { id },
        data,
        include: { department: true, manager: { select: { id: true, fullName: true } } },
      });
    }),

  // Alle innloggede: hent aktive ansatte gruppert per avdeling
  byDepartment: profileProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.db.profile.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        title: true,
        phone: true,
        email: true,
        avatarUrl: true,
        role: true,
        department: { select: { id: true, name: true } },
        profileAssignments: {
          where: { isPrimary: true, endDate: null },
          select: { location: { select: { name: true } } },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    });

    const map = new Map<string, { deptId: string; deptName: string; members: typeof profiles }>();
    for (const p of profiles) {
      const key = p.department?.id ?? "__none__";
      const name = p.department?.name ?? "Ingen avdeling";
      if (!map.has(key)) map.set(key, { deptId: key, deptName: name, members: [] });
      map.get(key)!.members.push(p);
    }
    return Array.from(map.values()).sort((a, b) => a.deptName.localeCompare(b.deptName, "nb"));
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
});
