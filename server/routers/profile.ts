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
  dateOfBirth: z.string().optional().nullable(),
  probationEndsAt: z.string().optional().nullable(),
  employedAt: z.string().optional(),
  terminatedAt: z.string().optional().nullable(),
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
});
