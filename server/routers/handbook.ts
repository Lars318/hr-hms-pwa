import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { notifyAllActive } from "@/lib/notifications";

export const handbookRouter = router({
  // ── Liste alle kategorier med seksjoner ──────────────────────────────────
  listCategories: profileProcedure.query(async ({ ctx }) => {
    return ctx.db.handbookCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        sections: { orderBy: { order: "asc" } },
      },
    });
  }),

  // ── Hent én kategori ─────────────────────────────────────────────────────
  categoryById: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cat = await ctx.db.handbookCategory.findUnique({
        where: { id: input.id },
        include: { sections: { orderBy: { order: "asc" } } },
      });
      if (!cat) throw new TRPCError({ code: "NOT_FOUND" });
      return cat;
    }),

  // ── Opprett kategori (HR/ADMIN) ──────────────────────────────────────────
  createCategory: hrProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        order: z.number().int().optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.handbookCategory.create({
        data: {
          title: input.title,
          description: input.description,
          order: input.order,
        },
      });
    }),

  // ── Oppdater kategori (HR/ADMIN) ─────────────────────────────────────────
  updateCategory: hrProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(500).nullable().optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.handbookCategory.update({
        where: { id },
        data,
      });
    }),

  // ── Slett kategori (HR/ADMIN) ────────────────────────────────────────────
  deleteCategory: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.handbookCategory.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Upsert seksjon (HR/ADMIN) ─────────────────────────────────────────────
  upsertSection: hrProcedure
    .input(
      z.object({
        id: z.string().optional(),
        categoryId: z.string(),
        title: z.string().min(1).max(200),
        content: z.string(),
        order: z.number().int().optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return ctx.db.handbookSection.update({ where: { id }, data });
      }
      return ctx.db.handbookSection.create({ data });
    }),

  // ── Slett seksjon (HR/ADMIN) ──────────────────────────────────────────────
  deleteSection: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.handbookSection.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Siste publiserte versjon ──────────────────────────────────────────────
  latestVersion: profileProcedure.query(async ({ ctx }) => {
    return ctx.db.handbookVersion.findFirst({
      orderBy: { version: "desc" },
      include: { publishedBy: { select: { fullName: true } } },
    });
  }),

  // ── Versjonshistorikk (HR/ADMIN) ─────────────────────────────────────────
  versionHistory: hrProcedure.query(async ({ ctx }) => {
    return ctx.db.handbookVersion.findMany({
      orderBy: { version: "desc" },
      take: 10,
      include: {
        publishedBy: { select: { fullName: true } },
        _count: { select: { acknowledgements: true } },
      },
    });
  }),

  // ── Publiser ny versjon (HR/ADMIN) ────────────────────────────────────────
  publish: hrProcedure
    .input(z.object({ publishNote: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = ctx;

      const latest = await db.handbookVersion.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = (latest?.version ?? 0) + 1;

      const version = await db.handbookVersion.create({
        data: {
          version: nextVersion,
          publishNote: input.publishNote,
          publishedById: profile.id,
        },
      });

      await notifyAllActive({
        db,
        type: "HANDBOOK_PUBLISHED",
        title: `Personalhåndboken er oppdatert – versjon ${nextVersion}`,
        message: input.publishNote
          ? `${input.publishNote} Bekreft at du har lest den.`
          : "En ny versjon av personalhåndboken er publisert. Bekreft at du har lest den.",
        linkUrl: "/personalhandbok",
        excludeProfileId: profile.id,
      });

      return version;
    }),

  // ── Bekreft lest (alle) ───────────────────────────────────────────────────
  acknowledge: profileProcedure
    .input(z.object({ versionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, profile } = ctx;
      const existing = await db.handbookAcknowledgement.findUnique({
        where: { versionId_profileId: { versionId: input.versionId, profileId: profile.id } },
      });
      if (existing) return existing;
      return db.handbookAcknowledgement.create({
        data: { versionId: input.versionId, profileId: profile.id },
      });
    }),

  // ── Min bekreftelse for siste versjon ────────────────────────────────────
  myAcknowledgement: profileProcedure.query(async ({ ctx }) => {
    const { db, profile } = ctx;
    const latest = await db.handbookVersion.findFirst({
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if (!latest) return null;
    return db.handbookAcknowledgement.findUnique({
      where: { versionId_profileId: { versionId: latest.id, profileId: profile.id } },
    });
  }),

  // ── Lesestatus for siste versjon (HR/ADMIN) ──────────────────────────────
  readStatus: hrProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const latest = await db.handbookVersion.findFirst({
      orderBy: { version: "desc" },
      include: {
        acknowledgements: {
          include: {
            profile: {
              select: { id: true, fullName: true, email: true, department: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!latest) return { version: null, read: [], unread: [] };

    const activeProfiles = await db.profile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, email: true, department: { select: { name: true } } },
      orderBy: { fullName: "asc" },
    });

    const readIds = new Set(latest.acknowledgements.map((a) => a.profileId));
    const read = activeProfiles.filter((p) => readIds.has(p.id));
    const unread = activeProfiles.filter((p) => !readIds.has(p.id));

    return {
      version: {
        id: latest.id,
        version: latest.version,
        publishedAt: latest.publishedAt,
        publishNote: latest.publishNote,
      },
      read,
      unread,
    };
  }),
});
