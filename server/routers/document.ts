import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { notifyAllActive, notifyHrAdmins } from "@/lib/notifications";
import {
  createAdminClient,
  DOCUMENT_BUCKET,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  sanitizeFileName,
} from "@/lib/supabase/admin";
import type { DocumentVisibility } from "@prisma/client";
import { uploadUrlLimit } from "@/lib/security/rateLimit";

const categories = [
  "POLICY", "PROCEDURE", "INSTRUCTION", "CHECKLIST",
  "TEMPLATE", "HMS", "HR", "OTHER",
] as const;

const visibilities = ["PUBLIC", "PRIVATE"] as const;

// Sjekk om bruker kan se dokumentet
function canViewDocument(
  role: string,
  visibility: DocumentVisibility
): boolean {
  if (visibility === "PUBLIC") return true;
  return role === "ADMIN" || role === "HR";
}

export const documentRouter = router({
  // ── list ──────────────────────────────────────────────────────────────────
  list: profileProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.enum(categories).optional(),
        visibility: z.enum(visibilities).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      // Vanlige ansatte ser kun PUBLIC
      const visibilityFilter = isHrAdmin
        ? input.visibility
          ? { visibility: input.visibility }
          : undefined
        : { visibility: "PUBLIC" as const };

      const docs = await db.document.findMany({
        where: {
          ...visibilityFilter,
          ...(input.category ? { category: input.category } : {}),
          ...(input.search
            ? {
                OR: [
                  { title: { contains: input.search, mode: "insensitive" } },
                  { description: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          owner: { select: { id: true, fullName: true } },
          _count: { select: { readConfirmations: true } },
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });

      // For hvert dokument: har innlogget bruker bekreftet gjeldende versjon?
      const confirmations = await db.documentReadConfirmation.findMany({
        where: {
          profileId: profile.id,
          documentId: { in: docs.map((d) => d.id) },
        },
        select: { documentId: true, documentVersion: true },
      });

      const confirmedMap = new Map(confirmations.map((c) => [c.documentId, c.documentVersion]));

      return docs.map((doc) => ({
        ...doc,
        isConfirmedByMe: confirmedMap.get(doc.id) === doc.version,
      }));
    }),

  // ── byId ──────────────────────────────────────────────────────────────────
  byId: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      const doc = await db.document.findUnique({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, fullName: true } },
          readConfirmations: {
            include: { profile: { select: { id: true, fullName: true, email: true } } },
            orderBy: { confirmedAt: "desc" },
          },
        },
      });

      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument ikke funnet." });
      if (!canViewDocument(profile.role, doc.visibility)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette dokumentet." });
      }

      const myConfirmation = doc.readConfirmations.find(
        (c) => c.profileId === profile.id && c.documentVersion === doc.version
      );

      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

      // Lesestatistikk kun for HR/ADMIN
      let readStats = null;
      if (isHrAdmin) {
        const totalActive = await db.profile.count({ where: { status: "ACTIVE" } });
        const confirmedCount = await db.documentReadConfirmation.count({
          where: { documentId: doc.id, documentVersion: doc.version },
        });
        readStats = {
          total: totalActive,
          confirmed: confirmedCount,
          notConfirmed: totalActive - confirmedCount,
          percentage: totalActive > 0 ? Math.round((confirmedCount / totalActive) * 100) : 0,
        };
      }

      return {
        ...doc,
        isConfirmedByMe: !!myConfirmation,
        readStats,
      };
    }),

  // ── createUploadUrl ────────────────────────────────────────────────────────
  // Steg 1 i opplastingsflyten – returnerer signert URL og ny dokumentID
  createUploadUrl: hrProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]]),
        sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES, {
          message: `Maks filstørrelse er ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        }),
        existingDocumentId: z.string().optional(), // sett ved oppdatering av eksisterende
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateCheck = uploadUrlLimit(ctx.profile.id);
      if (!rateCheck.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "For mange opplastinger. Prøv igjen om litt." });
      }

      const documentId = input.existingDocumentId ?? createId();
      const safe = sanitizeFileName(input.fileName);
      const versionStamp = Date.now();
      const filePath = `documents/${documentId}/${versionStamp}-${safe}`;

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUploadUrl(filePath, { upsert: false });

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke opprette opplastings-URL: ${error?.message ?? "ukjent feil"}`,
        });
      }

      return { signedUrl: data.signedUrl, filePath, documentId };
    }),

  // ── create ─────────────────────────────────────────────────────────────────
  // Steg 3 – lagre dokumentmetadata etter vellykket opplasting
  create: hrProcedure
    .input(
      z.object({
        documentId: z.string(),
        title: z.string().min(1, "Tittel er påkrevd").max(200),
        category: z.enum(categories),
        description: z.string().max(1000).optional(),
        visibility: z.enum(visibilities),
        filePath: z.string().min(1).max(500),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]]),
        sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
        effectiveFrom: z.string().datetime({ offset: true }).optional(),
        expiresAt: z.string().datetime({ offset: true }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { documentId, effectiveFrom, expiresAt, ...rest } = input;

      const doc = await ctx.db.document.create({
        data: {
          id: documentId,
          ...rest,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          ownerId: ctx.profile.id,
          version: 1,
        },
        include: { owner: { select: { id: true, fullName: true } } },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "Document",
          entityId: doc.id,
          action: "DOCUMENT_CREATE",
          actorId: ctx.profile.id,
          metadata: { title: doc.title, category: doc.category, visibility: doc.visibility },
        },
      });

      if (doc.visibility === "PUBLIC") {
        // Varsle alle aktive ansatte om at de bør lese dokumentet
        await notifyAllActive({
          db: ctx.db,
          type: "DOCUMENT_REQUIRES_READ",
          title: "Nytt dokument krever lesing",
          message: `"${doc.title}" er publisert og krever lesebekreftelse`,
          linkUrl: `/dokumenter/${doc.id}`,
          excludeProfileId: ctx.profile.id,
        });
      } else {
        // PRIVATE: varsle HR/ADMIN
        await notifyHrAdmins({
          db: ctx.db,
          type: "DOCUMENT_REQUIRES_READ",
          title: "Nytt internt dokument",
          message: `"${doc.title}" er publisert (synlig for HR/ADMIN)`,
          linkUrl: `/dokumenter/${doc.id}`,
          excludeProfileId: ctx.profile.id,
        });
      }

      return doc;
    }),

  // ── update ─────────────────────────────────────────────────────────────────
  // Oppdater metadata. Ny fil → bumpVersion: true → version + 1
  update: hrProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        category: z.enum(categories).optional(),
        description: z.string().max(1000).optional().nullable(),
        visibility: z.enum(visibilities).optional(),
        effectiveFrom: z.string().datetime({ offset: true }).optional().nullable(),
        expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
        // Ny fil
        filePath: z.string().max(500).optional(),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]]).optional(),
        sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES).optional(),
        bumpVersion: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, effectiveFrom, expiresAt, bumpVersion, ...rest } = input;

      const existing = await ctx.db.document.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument ikke funnet." });

      const updated = await ctx.db.document.update({
        where: { id },
        data: {
          ...rest,
          ...(bumpVersion ? { version: { increment: 1 } } : {}),
          ...(effectiveFrom !== undefined
            ? { effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null }
            : {}),
          ...(expiresAt !== undefined
            ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
            : {}),
        },
        include: { owner: { select: { id: true, fullName: true } } },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "Document",
          entityId: id,
          action: "DOCUMENT_UPDATE",
          actorId: ctx.profile.id,
          metadata: {
            ...(bumpVersion ? { newVersion: updated.version } : {}),
            updatedFields: Object.keys(rest),
          },
        },
      });

      return updated;
    }),

  // ── createSignedDownloadUrl ────────────────────────────────────────────────
  createSignedDownloadUrl: profileProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument ikke funnet." });
      if (!canViewDocument(ctx.profile.role, doc.visibility)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette dokumentet." });
      }

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(doc.filePath, 60);

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke generere nedlastings-URL: ${error?.message ?? "ukjent feil"}`,
        });
      }

      // Logg nedlasting
      await ctx.db.auditLog.create({
        data: {
          entityType: "Document",
          entityId: doc.id,
          action: "DOCUMENT_DOWNLOAD",
          actorId: ctx.profile.id,
          metadata: { version: doc.version },
        },
      });

      return { signedUrl: data.signedUrl, fileName: doc.title };
    }),

  // ── confirmRead ────────────────────────────────────────────────────────────
  confirmRead: profileProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument ikke funnet." });
      if (!canViewDocument(ctx.profile.role, doc.visibility)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette dokumentet." });
      }

      const confirmation = await ctx.db.documentReadConfirmation.upsert({
        where: {
          documentId_profileId_documentVersion: {
            documentId: doc.id,
            profileId: ctx.profile.id,
            documentVersion: doc.version,
          },
        },
        create: {
          documentId: doc.id,
          profileId: ctx.profile.id,
          documentVersion: doc.version,
        },
        update: { confirmedAt: new Date() },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "Document",
          entityId: doc.id,
          action: "DOCUMENT_READ_CONFIRM",
          actorId: ctx.profile.id,
          metadata: { version: doc.version },
        },
      });

      return confirmation;
    }),

  // ── readStatus ─────────────────────────────────────────────────────────────
  // HR/ADMIN: full lesestatistikk for et dokument
  readStatus: hrProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({
        where: { id: input.documentId },
        select: { id: true, version: true, title: true },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument ikke funnet." });

      const [totalActive, confirmed] = await Promise.all([
        ctx.db.profile.count({ where: { status: "ACTIVE" } }),
        ctx.db.documentReadConfirmation.findMany({
          where: { documentId: doc.id, documentVersion: doc.version },
          include: {
            profile: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { confirmedAt: "desc" },
        }),
      ]);

      const confirmedIds = new Set(confirmed.map((c) => c.profileId));
      const notConfirmedProfiles = await ctx.db.profile.findMany({
        where: { status: "ACTIVE", id: { notIn: [...confirmedIds] } },
        select: { id: true, fullName: true, email: true },
        orderBy: { fullName: "asc" },
      });

      return {
        document: doc,
        total: totalActive,
        confirmed: confirmed.length,
        notConfirmed: totalActive - confirmed.length,
        percentage: totalActive > 0 ? Math.round((confirmed.length / totalActive) * 100) : 0,
        confirmedBy: confirmed,
        notConfirmedBy: notConfirmedProfiles,
      };
    }),
});
