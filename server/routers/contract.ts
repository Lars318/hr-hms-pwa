import { z } from "zod";
import { router, hrProcedure, profileProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { createAdminClient, CONTRACT_BUCKET, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { createId } from "@paralleldrive/cuid2";

const CONTRACT_TYPES = ["EMPLOYMENT", "AMENDMENT", "TERMINATION", "OTHER"] as const;
const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"] as const;

// ─── RBAC helper ──────────────────────────────────────────────────────────────

async function assertAccess(profileId: string, role: string, contract: { employeeId: string; sharedWithEmployee: boolean }) {
  if (role === "ADMIN" || role === "HR") return;
  if (role === "EMPLOYEE") {
    if (contract.employeeId !== profileId || !contract.sharedWithEmployee) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return;
  }
  // MANAGER: must be responsible manager of the employee's location — simplified: allow if not EMPLOYEE
  return;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const contractRouter = router({
  list: profileProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      status: z.enum(CONTRACT_STATUSES).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.profile.role;
      const id = ctx.profile.id;

      const where =
        role === "ADMIN" || role === "HR"
          ? { employeeId: input?.employeeId, status: input?.status }
          : role === "MANAGER"
          ? { status: input?.status }           // managers see all in their scope (simplified)
          : { employeeId: id, sharedWithEmployee: true, status: input?.status };

      return db.contract.findMany({
        where,
        include: {
          employee: { select: { id: true, fullName: true, title: true } },
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  byId: profileProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const c = await db.contract.findUnique({
        where: { id: input },
        include: {
          employee: { select: { id: true, fullName: true, title: true, email: true } },
          createdBy: { select: { fullName: true } },
        },
      });
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      await assertAccess(ctx.profile.id, ctx.profile.role, c);
      return c;
    }),

  create: hrProcedure
    .input(z.object({
      employeeId: z.string(),
      title: z.string().min(1),
      type: z.enum(CONTRACT_TYPES),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.contract.create({
        data: {
          employeeId: input.employeeId,
          title: input.title,
          type: input.type,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          notes: input.notes,
          createdById: ctx.profile.id,
        },
      });
    }),

  update: hrProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      status: z.enum(CONTRACT_STATUSES).optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, startDate, endDate, ...rest } = input;
      return db.contract.update({
        where: { id },
        data: {
          ...rest,
          ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
          ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        },
      });
    }),

  // Upload contract file → returns signed upload URL
  getUploadUrl: hrProcedure
    .input(z.object({
      contractId: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Filtype ikke tillatt." });
      }
      if (input.fileSize > MAX_FILE_SIZE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Filen er for stor." });
      }

      const supabase = createAdminClient();
      const fileKey = `${input.contractId}/${createId()}-${input.fileName}`;

      const { data, error } = await supabase.storage
        .from(CONTRACT_BUCKET)
        .createSignedUploadUrl(fileKey);

      if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message });

      // Update contract with file metadata
      await db.contract.update({
        where: { id: input.contractId },
        data: {
          fileKey,
          fileName: input.fileName,
          fileMimeType: input.mimeType,
        },
      });

      return { signedUrl: data.signedUrl, token: data.token, fileKey };
    }),

  // Get signed download URL
  getDownloadUrl: profileProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const c = await db.contract.findUnique({ where: { id: input } });
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      await assertAccess(ctx.profile.id, ctx.profile.role, c);
      if (!c.fileKey) throw new TRPCError({ code: "NOT_FOUND", message: "Ingen fil lastet opp." });

      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from(CONTRACT_BUCKET)
        .createSignedUrl(c.fileKey, 300);

      if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message });
      return { url: data.signedUrl };
    }),

  // Share contract with employee
  share: hrProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      const c = await db.contract.findUnique({
        where: { id: input },
        include: { employee: { select: { id: true, fullName: true } } },
      });
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await db.contract.update({
        where: { id: input },
        data: { sharedWithEmployee: true, sharedAt: new Date() },
      });

      await createNotification({
        db,
        recipientId: c.employee.id,
        type: "CONTRACT_SHARED",
        title: "Ny kontrakt tilgjengelig",
        message: `En kontrakt er gjort tilgjengelig for deg: ${c.title}.`,
        linkUrl: `/kontrakter/${c.id}`,
      });

      return updated;
    }),
});
