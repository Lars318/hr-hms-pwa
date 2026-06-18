import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";

export const employmentRecordRouter = router({
  // ── list for a profile ────────────────────────────────────────────────────
  list: profileProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isOwn = profile.id === input.profileId;
      const isManagerOfEmployee =
        profile.role === "MANAGER" &&
        (await db.profile.findUnique({ where: { id: input.profileId }, select: { departmentId: true } }))
          ?.departmentId === profile.departmentId;

      if (!isHrAdmin && !isOwn && !isManagerOfEmployee) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.employmentRecord.findMany({
        where: { profileId: input.profileId },
        include: { createdBy: { select: { id: true, fullName: true } } },
        orderBy: { effectiveFrom: "desc" },
      });
    }),

  // ── current (latest active record) ───────────────────────────────────────
  current: profileProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isOwn = profile.id === input.profileId;
      if (!isHrAdmin && !isOwn) throw new TRPCError({ code: "FORBIDDEN" });

      return db.employmentRecord.findFirst({
        where: { profileId: input.profileId, effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      });
    }),

  // ── create ────────────────────────────────────────────────────────────────
  create: hrProcedure
    .input(z.object({
      profileId: z.string(),
      effectiveFrom: z.string().min(1),
      employmentPercentage: z.number().min(0).max(100).default(100),
      salary: z.number().int().min(0).optional(),
      salaryType: z.enum(["MONTHLY", "HOURLY", "ANNUAL"]).default("MONTHLY"),
      jobTitle: z.string().max(200).optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      // Close the previous open record
      await db.employmentRecord.updateMany({
        where: { profileId: input.profileId, effectiveTo: null },
        data: { effectiveTo: new Date(input.effectiveFrom) },
      });

      return db.employmentRecord.create({
        data: {
          profileId: input.profileId,
          effectiveFrom: new Date(input.effectiveFrom),
          employmentPercentage: input.employmentPercentage,
          salary: input.salary ?? null,
          salaryType: input.salaryType,
          jobTitle: input.jobTitle ?? null,
          notes: input.notes ?? null,
          createdById: profile.id,
        },
      });
    }),

  // ── update ────────────────────────────────────────────────────────────────
  update: hrProcedure
    .input(z.object({
      id: z.string(),
      employmentPercentage: z.number().min(0).max(100).optional(),
      salary: z.number().int().min(0).optional(),
      salaryType: z.enum(["MONTHLY", "HOURLY", "ANNUAL"]).optional(),
      jobTitle: z.string().max(200).optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { id, ...data } = input;
      return db.employmentRecord.update({
        where: { id },
        data: {
          ...(data.employmentPercentage !== undefined ? { employmentPercentage: data.employmentPercentage } : {}),
          ...(data.salary !== undefined ? { salary: data.salary } : {}),
          ...(data.salaryType ? { salaryType: data.salaryType } : {}),
          ...(data.jobTitle !== undefined ? { jobTitle: data.jobTitle } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });
    }),
});
