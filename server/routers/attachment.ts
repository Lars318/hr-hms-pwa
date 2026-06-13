import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { router, profileProcedure } from "@/server/trpc/trpc";
import {
  createAdminClient,
  ATTACHMENT_BUCKET,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  sanitizeFileName,
} from "@/lib/supabase/admin";
import { uploadUrlLimit } from "@/lib/security/rateLimit";

// ── hjelpefunksjon: sjekk om brukeren har tilgang til avviket ────────────────
async function assertIncidentAccess(
  db: import("@prisma/client").PrismaClient,
  profile: { id: string; role: string; departmentId: string | null },
  incidentId: string
) {
  const incident = await db.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Avvik ikke funnet." });

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isManagerOfDept =
    profile.role === "MANAGER" && incident.departmentId === profile.departmentId;
  const isOwner = incident.reportedById === profile.id;

  if (!isHrAdmin && !isManagerOfDept && !isOwner) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til dette avviket." });
  }

  return { incident, isHrAdmin, isManagerOfDept, isOwner };
}

export const attachmentRouter = router({
  // ── createUploadUrl ────────────────────────────────────────────────────────
  // Server genererer signert upload-URL (krever service role).
  // Klienten bruker URL-en til å PUT-e filen direkte til Supabase.
  createUploadUrl: profileProcedure
    .input(
      z.object({
        incidentId: z.string(),
        fileName: z.string().min(1).max(255),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]]),
        sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES, {
          message: `Maks filstørrelse er ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateCheck = uploadUrlLimit(ctx.profile.id);
      if (!rateCheck.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "For mange opplastinger. Prøv igjen om litt." });
      }

      await assertIncidentAccess(ctx.db, ctx.profile, input.incidentId);

      const attachmentId = createId();
      const safe = sanitizeFileName(input.fileName);
      const filePath = `incidents/${input.incidentId}/${attachmentId}-${safe}`;

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUploadUrl(filePath, { upsert: false });

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke opprette opplastings-URL: ${error?.message ?? "ukjent feil"}`,
        });
      }

      return {
        signedUrl: data.signedUrl,
        filePath,
        attachmentId,
      };
    }),

  // ── createMetadata ─────────────────────────────────────────────────────────
  // Kalles etter vellykket opplasting til Supabase Storage.
  // Lagrer metadata i Postgres og skriver audit log.
  createMetadata: profileProcedure
    .input(
      z.object({
        attachmentId: z.string().min(1).max(128),
        incidentId: z.string().min(1).max(128),
        fileName: z.string().min(1).max(255),
        filePath: z.string().min(1).max(500),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]]),
        sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertIncidentAccess(ctx.db, ctx.profile, input.incidentId);

      // Dobbeltsjekk at filen faktisk finnes i storage (forhindrer falske metadata-rader)
      const admin = createAdminClient();
      const { data: fileData, error: fileError } = await admin.storage
        .from(ATTACHMENT_BUCKET)
        .list(`incidents/${input.incidentId}`, {
          search: input.attachmentId,
        });

      if (fileError || !fileData?.some((f) => input.filePath.includes(f.name))) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Filen ble ikke funnet i storage. Last opp på nytt.",
        });
      }

      const attachment = await ctx.db.attachment.create({
        data: {
          id: input.attachmentId,
          fileName: input.fileName,
          filePath: input.filePath,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          incidentId: input.incidentId,
          uploadedById: ctx.profile.id,
        },
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "Attachment",
          entityId: attachment.id,
          action: "ATTACHMENT_UPLOAD",
          actorId: ctx.profile.id,
          incidentId: input.incidentId,
          metadata: { fileName: input.fileName, sizeBytes: input.sizeBytes },
        },
      });

      return attachment;
    }),

  // ── listByIncident ─────────────────────────────────────────────────────────
  listByIncident: profileProcedure
    .input(z.object({ incidentId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertIncidentAccess(ctx.db, ctx.profile, input.incidentId);

      return ctx.db.attachment.findMany({
        where: { incidentId: input.incidentId },
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // ── createSignedDownloadUrl ────────────────────────────────────────────────
  // Returnerer en tidsbegrenset (60 sek) signert nedlastings-URL.
  createSignedDownloadUrl: profileProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.attachment.findUnique({
        where: { id: input.attachmentId },
      });
      if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "Vedlegg ikke funnet." });

      await assertIncidentAccess(ctx.db, ctx.profile, attachment.incidentId);

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.filePath, 60);

      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke generere nedlastings-URL: ${error?.message ?? "ukjent feil"}`,
        });
      }

      return { signedUrl: data.signedUrl, fileName: attachment.fileName };
    }),

  // ── delete ─────────────────────────────────────────────────────────────────
  // HR/ADMIN: kan alltid slette
  // Opplaster: kan slette egne vedlegg kun mens avviket er OPEN
  delete: profileProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.attachment.findUnique({
        where: { id: input.attachmentId },
        include: { incident: true },
      });
      if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "Vedlegg ikke funnet." });

      const { profile, db } = ctx;
      const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
      const isOwner = attachment.uploadedById === profile.id;
      const incidentIsOpen = attachment.incident.status === "OPEN";

      if (!isHrAdmin && !(isOwner && incidentIsOpen)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: isOwner
            ? "Du kan kun slette vedlegg mens avviket er åpent."
            : "Ingen tilgang til å slette dette vedlegget.",
        });
      }

      // Slett fra Supabase Storage
      const admin = createAdminClient();
      const { error } = await admin.storage
        .from(ATTACHMENT_BUCKET)
        .remove([attachment.filePath]);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke slette fil fra storage: ${error.message}`,
        });
      }

      // Slett metadata og logg
      await db.attachment.delete({ where: { id: input.attachmentId } });

      await db.auditLog.create({
        data: {
          entityType: "Attachment",
          entityId: input.attachmentId,
          action: "ATTACHMENT_DELETE",
          actorId: profile.id,
          incidentId: attachment.incidentId,
          metadata: { fileName: attachment.fileName },
        },
      });

      return { success: true };
    }),
});
