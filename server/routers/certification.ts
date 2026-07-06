import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

export const CERTIFICATION_CATEGORIES = [
  "FIRST_AID",
  "FIRE_SAFETY",
  "PT",
  "ELECTRICAL",
  "OTHER",
] as const;

const upsertInput = z.object({
  id: z.string().optional(),
  profileId: z.string(),
  name: z.string().min(1),
  category: z.enum(CERTIFICATION_CATEGORIES).default("OTHER"),
  issuer: z.string().optional().nullable(),
  issuedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const certificationRouter = router({
  // Sertifikater for én ansatt (HR/ADMIN, eller egen profil)
  listForProfile: profileProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isHrAdmin = ctx.profile.role === "ADMIN" || ctx.profile.role === "HR";
      if (!isHrAdmin && ctx.profile.id !== input.profileId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.certification.findMany({
        where: { profileId: input.profileId },
        orderBy: [{ expiresAt: "asc" }, { name: "asc" }],
      });
    }),

  // Kompetansematrise: alle sertifikater med utløpsstatus (HR/ADMIN)
  matrix: hrProcedure
    .input(
      z.object({
        category: z.enum(CERTIFICATION_CATEGORIES).optional(),
        onlyExpiring: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);

      const certs = await db.certification.findMany({
        where: {
          category: input?.category,
          ...(input?.onlyExpiring
            ? { expiresAt: { not: null, lte: in30 } }
            : {}),
          profile: { status: "ACTIVE" },
        },
        include: {
          profile: { select: { id: true, fullName: true, department: { select: { name: true } } } },
        },
        orderBy: [{ expiresAt: "asc" }],
      });
      return certs;
    }),

  upsert: hrProcedure.input(upsertInput).mutation(async ({ input }) => {
    const { id, ...data } = input;
    if (id) {
      return db.certification.update({ where: { id }, data });
    }
    return db.certification.create({ data });
  }),

  delete: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.certification.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
