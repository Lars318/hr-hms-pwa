import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

const courseInclude = {
  location: { select: { id: true, name: true } },
  _count: { select: { records: true } },
} satisfies Prisma.TrainingCourseInclude;

const recordInclude = {
  course: { select: { id: true, name: true, category: true, validityMonths: true } },
  profile: { select: { id: true, fullName: true, email: true } },
  registeredBy: { select: { id: true, fullName: true } },
} satisfies Prisma.TrainingRecordInclude;

function canManageCourse(role: string) {
  return role === "ADMIN" || role === "HR";
}

function canRegisterRecord(role: string, profileId: string, targetProfileId: string) {
  if (role === "ADMIN" || role === "HR") return true;
  // MANAGER kan registrere for andre – kontrolleres videre mot lokasjon i prosedyren
  if (role === "MANAGER") return true;
  // EMPLOYEE kan ikke registrere for andre
  return profileId === targetProfileId;
}

export const trainingRouter = router({
  // ─── Kurs ───────────────────────────────────────────────────────────────────

  listCourses: profileProcedure
    .input(
      z.object({
        locationId: z.string().optional(),
        isRequired: z.boolean().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.trainingCourse.findMany({
        where: {
          status: input?.status ?? "ACTIVE",
          ...(input?.locationId ? { locationId: input.locationId } : {}),
          ...(input?.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
        },
        include: courseInclude,
        orderBy: [{ isRequired: "desc" }, { name: "asc" }],
      });
    }),

  courseById: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.trainingCourse.findUnique({
        where: { id: input.id },
        include: {
          ...courseInclude,
          records: {
            include: recordInclude,
            orderBy: { completedAt: "desc" },
          },
        },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      // EMPLOYEE ser ikke andres records
      if (ctx.profile.role === "EMPLOYEE") {
        course.records = course.records.filter((r) => r.profileId === ctx.profile.id);
      }
      return course;
    }),

  createCourse: hrProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        isRequired: z.boolean().default(false),
        validityMonths: z.number().int().positive().optional(),
        locationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.trainingCourse.create({
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          isRequired: input.isRequired,
          validityMonths: input.validityMonths,
          locationId: input.locationId,
        },
        include: courseInclude,
      });
      return course;
    }),

  updateCourse: hrProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().min(1).optional(),
        isRequired: z.boolean().optional(),
        validityMonths: z.number().int().positive().nullable().optional(),
        locationId: z.string().nullable().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.trainingCourse.update({
        where: { id },
        data,
        include: courseInclude,
      });
    }),

  // ─── Records ────────────────────────────────────────────────────────────────

  myRecords: profileProcedure
    .query(async ({ ctx }) => {
      return ctx.db.trainingRecord.findMany({
        where: { profileId: ctx.profile.id },
        include: recordInclude,
        orderBy: { completedAt: "desc" },
      });
    }),

  recordsForProfile: profileProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { role, id: myId } = ctx.profile;
      // EMPLOYEE kan kun se egne
      if (role === "EMPLOYEE" && input.profileId !== myId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.trainingRecord.findMany({
        where: { profileId: input.profileId },
        include: recordInclude,
        orderBy: { completedAt: "desc" },
      });
    }),

  // Hvem mangler / hvem utløper – kun HR/ADMIN/MANAGER
  courseStatus: profileProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { role } = ctx.profile;
      if (role === "EMPLOYEE") throw new TRPCError({ code: "FORBIDDEN" });

      const course = await ctx.db.trainingCourse.findUnique({
        where: { id: input.courseId },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      const records = await ctx.db.trainingRecord.findMany({
        where: { courseId: input.courseId },
        include: { profile: { select: { id: true, fullName: true, email: true, status: true } } },
      });

      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return records.map((r) => ({
        ...r,
        isExpired: r.expiresAt ? r.expiresAt < now : false,
        isExpiringSoon: r.expiresAt ? r.expiresAt > now && r.expiresAt < soonThreshold : false,
      }));
    }),

  createRecord: profileProcedure
    .input(
      z.object({
        courseId: z.string(),
        profileId: z.string(),
        completedAt: z.string().datetime(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { role, id: myId } = ctx.profile;

      if (!canRegisterRecord(role, myId, input.profileId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const course = await ctx.db.trainingCourse.findUnique({
        where: { id: input.courseId },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Kurs ikke funnet" });

      const completedAt = new Date(input.completedAt);
      const expiresAt =
        course.validityMonths
          ? new Date(completedAt.getFullYear(), completedAt.getMonth() + course.validityMonths, completedAt.getDate())
          : null;

      // Upsert: oppdater hvis record allerede finnes
      const record = await ctx.db.trainingRecord.upsert({
        where: { courseId_profileId: { courseId: input.courseId, profileId: input.profileId } },
        update: { completedAt, expiresAt, notes: input.notes, registeredById: myId, updatedAt: new Date() },
        create: {
          courseId: input.courseId,
          profileId: input.profileId,
          completedAt,
          expiresAt,
          notes: input.notes,
          registeredById: myId,
        },
        include: recordInclude,
      });

      await ctx.db.trainingAuditLog.create({
        data: {
          recordId: record.id,
          actorId: myId,
          action: "RECORD_CREATED",
          metadata: { courseId: input.courseId, profileId: input.profileId, completedAt: input.completedAt },
        },
      });

      // Varsle ansatt hvis andre har registrert
      if (input.profileId !== myId) {
        await createNotification({
          db: ctx.db,
          recipientId: input.profileId,
          type: "SYSTEM",
          title: "Opplæring registrert",
          message: `Du er registrert som fullført på kurset «${course.name}».`,
          linkUrl: "/opplaering/mine",
        });
      }

      return record;
    }),

  deleteRecord: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.trainingRecord.findUnique({ where: { id: input.id } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.trainingAuditLog.create({
        data: {
          recordId: input.id,
          actorId: ctx.profile.id,
          action: "RECORD_DELETED",
          metadata: { courseId: record.courseId, profileId: record.profileId },
        },
      });

      return ctx.db.trainingRecord.delete({ where: { id: input.id } });
    }),

  // ─── Admin-oversikt ──────────────────────────────────────────────────────────

  // Alle records med filter – kun HR/ADMIN/MANAGER
  adminRecords: profileProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        locationId: z.string().optional(),
        expiringSoon: z.boolean().optional(),
        expired: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { role } = ctx.profile;
      if (role === "EMPLOYEE") throw new TRPCError({ code: "FORBIDDEN" });

      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const where: Prisma.TrainingRecordWhereInput = {
        ...(input?.courseId ? { courseId: input.courseId } : {}),
        ...(input?.locationId
          ? { profile: { profileAssignments: { some: { locationId: input.locationId, isPrimary: true } } } }
          : {}),
        ...(input?.expiringSoon ? { expiresAt: { gt: now, lte: soonThreshold } } : {}),
        ...(input?.expired ? { expiresAt: { lt: now } } : {}),
      };

      const records = await ctx.db.trainingRecord.findMany({
        where,
        include: recordInclude,
        orderBy: [{ expiresAt: "asc" }, { completedAt: "desc" }],
      });

      return records.map((r) => ({
        ...r,
        isExpired: r.expiresAt ? r.expiresAt < now : false,
        isExpiringSoon: r.expiresAt ? r.expiresAt > now && r.expiresAt < soonThreshold : false,
      }));
    }),

  // ─── Kompetansematrise ──────────────────────────────────────────────────────
  matrix: hrProcedure
    .input(z.object({ departmentId: z.string().optional(), requiredOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [courses, profiles] = await Promise.all([
        ctx.db.trainingCourse.findMany({
          where: { status: "ACTIVE", ...(input.requiredOnly ? { isRequired: true } : {}) },
          orderBy: [{ isRequired: "desc" }, { category: "asc" }, { name: "asc" }],
          select: { id: true, name: true, category: true, isRequired: true, validityMonths: true },
        }),
        ctx.db.profile.findMany({
          where: { status: "ACTIVE", ...(input.departmentId ? { departmentId: input.departmentId } : {}) },
          orderBy: [{ fullName: "asc" }],
          select: {
            id: true, fullName: true, title: true,
            department: { select: { id: true, name: true } },
            trainingRecords: { select: { courseId: true, completedAt: true, expiresAt: true } },
          },
        }),
      ]);

      const rows = profiles.map((p) => {
        const recordMap = new Map(p.trainingRecords.map((r) => [r.courseId, r]));
        const cells = courses.map((c) => {
          const rec = recordMap.get(c.id);
          if (!rec) return { status: "missing" as const };
          if (rec.expiresAt && rec.expiresAt < now) return { status: "expired" as const, expiresAt: rec.expiresAt };
          if (rec.expiresAt && rec.expiresAt < soon) return { status: "expiring" as const, expiresAt: rec.expiresAt };
          return { status: "ok" as const, completedAt: rec.completedAt };
        });
        return { profile: { id: p.id, fullName: p.fullName, title: p.title, department: p.department }, cells };
      });

      return { courses, rows };
    }),

  // Antall obligatoriske kurs som mangler – brukes til dashboardkort
  openCount: profileProcedure
    .query(async ({ ctx }) => {
      const { role } = ctx.profile;
      if (role === "EMPLOYEE") return null;

      const required = await ctx.db.trainingCourse.count({ where: { isRequired: true, status: "ACTIVE" } });
      const now = new Date();
      const validRecords = await ctx.db.trainingRecord.count({
        where: {
          course: { isRequired: true, status: "ACTIVE" },
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
      });

      return { required, validRecords };
    }),
});
