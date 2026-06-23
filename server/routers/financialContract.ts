import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { router, adminProcedure } from "@/server/trpc/trpc";
import {
  createAdminClient,
  FINANCIAL_CONTRACTS_BUCKET,
  sanitizeFileName,
} from "@/lib/supabase/admin";
import { uploadUrlLimit } from "@/lib/security/rateLimit";
import {
  extractFinancialContract,
  isFinancialContractAiEnabled,
  type ExtractedFinancialContract,
} from "@/lib/financialContractAi";
import type { Prisma } from "@prisma/client";

const CONTRACT_TYPES = [
  "RENT",
  "LEASE",
  "HUSLEIE",
  "SERVICE_AGREEMENT",
  "SUBSCRIPTION",
  "INSURANCE",
  "SUPPLIER",
  "OTHER",
] as const;

const CONTRACT_STATUSES = [
  "ACTIVE",
  "EXPIRES_SOON",
  "EXPIRED",
  "TERMINATED",
  "DRAFT",
] as const;

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

const attachmentInput = z
  .object({
    fileName: z.string().min(1).max(255),
    filePath: z.string().min(1).max(500),
    mimeType: z.string().min(1).max(120),
    sizeBytes: z.number().int().positive().max(MAX_PDF_BYTES),
  })
  .optional();

const contractFields = {
  name: z.string().min(1, "Navn er påkrevd").max(200),
  contractNumber: z.string().max(120).optional().nullable(),
  type: z.enum(CONTRACT_TYPES),
  supplierName: z.string().min(1, "Leverandør er påkrevd").max(200),
  locationId: z.string().optional().nullable(),
  centerName: z.string().max(200).optional().nullable(),
  areaSqm: z.number().nonnegative().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  durationMonths: z.number().int().optional().nullable(),
  monthlyAmount: z.number().optional().nullable(),
  annualAmount: z.number().optional().nullable(),
  totalValue: z.number().optional().nullable(),
  currency: z.string().max(8).default("NOK"),
  status: z.enum(CONTRACT_STATUSES).default("DRAFT"),
  renewalOption: z.boolean().default(false),
  noticePeriodMonths: z.number().int().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
};

function toDate(v?: string | null): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export const financialContractRouter = router({
  // ── list ────────────────────────────────────────────────────────────────
  list: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: z.enum(CONTRACT_TYPES).optional(),
          status: z.enum(CONTRACT_STATUSES).optional(),
          locationId: z.string().optional(),
          year: z.number().int().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(20),
          sortBy: z
            .enum(["name", "supplierName", "endDate", "monthlyAmount", "createdAt"])
            .default("createdAt"),
          sortDir: z.enum(["asc", "desc"]).default("desc"),
        })
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.FinancialContractWhereInput = {
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.locationId ? { locationId: input.locationId } : {}),
        ...(input.year
          ? {
              startDate: {
                gte: new Date(Date.UTC(input.year, 0, 1)),
                lt: new Date(Date.UTC(input.year + 1, 0, 1)),
              },
            }
          : {}),
        ...(input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { supplierName: { contains: input.search, mode: "insensitive" } },
                { contractNumber: { contains: input.search, mode: "insensitive" } },
                { centerName: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        ctx.db.financialContract.count({ where }),
        ctx.db.financialContract.findMany({
          where,
          include: {
            location: { select: { id: true, name: true } },
            _count: { select: { attachments: true } },
          },
          orderBy: { [input.sortBy]: input.sortDir },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
      ]);

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  // ── getById ─────────────────────────────────────────────────────────────
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.financialContract.findUnique({
        where: { id: input.id },
        include: {
          location: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
          attachments: {
            orderBy: { createdAt: "desc" },
            include: { uploadedBy: { select: { fullName: true } } },
          },
        },
      });
      if (!contract)
        throw new TRPCError({ code: "NOT_FOUND", message: "Kontrakt ikke funnet." });
      return contract;
    }),

  // ── getSummary (KPI) ──────────────────────────────────────────────────────
  getSummary: adminProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
    const now = new Date();
    const chartYear = input?.year ?? now.getFullYear();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const active = await ctx.db.financialContract.findMany({
      where: { status: { in: ["ACTIVE", "EXPIRES_SOON"] } },
      select: {
        type: true,
        monthlyAmount: true,
        annualAmount: true,
        totalValue: true,
        startDate: true,
        endDate: true,
      },
    });

    let totalContractValue = 0;
    let totalMonthlyCost = 0;
    const valueByTypeMap = new Map<string, number>();
    const monthlyByMonth = new Array(12).fill(0) as number[];

    for (const c of active) {
      const monthly =
        c.monthlyAmount ?? (c.annualAmount != null ? c.annualAmount / 12 : 0);
      totalMonthlyCost += monthly;
      const value =
        c.totalValue ??
        c.annualAmount ??
        (c.monthlyAmount != null ? c.monthlyAmount * 12 : 0);
      totalContractValue += value;
      valueByTypeMap.set(c.type, (valueByTypeMap.get(c.type) ?? 0) + value);

      // Add monthly cost only for months the contract was active in chartYear
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(Date.UTC(chartYear, m, 1));
        const monthEnd = new Date(Date.UTC(chartYear, m + 1, 0, 23, 59, 59));
        const start = c.startDate ? new Date(c.startDate) : null;
        const end = c.endDate ? new Date(c.endDate) : null;
        const activeInMonth =
          (!start || start <= monthEnd) && (!end || end >= monthStart);
        if (activeInMonth) monthlyByMonth[m] += monthly;
      }
    }

    const expiringCount = await ctx.db.financialContract.count({
      where: {
        status: { in: ["ACTIVE", "EXPIRES_SOON"] },
        endDate: { gte: now, lte: in90Days },
      },
    });

    const contractCount = active.length;

    return {
      totalContractValue,
      totalMonthlyCost,
      expiringCount,
      contractCount,
      valueByType: Array.from(valueByTypeMap.entries()).map(([type, value]) => ({
        type,
        value,
      })),
      monthlyCostByMonth: monthlyByMonth.map((value, monthIndex) => ({
        monthIndex,
        value,
      })),
    };
  }),

  // ── create (+ optional attachment + dokumentarkiv-registrering) ───────────
  create: adminProcedure
    .input(
      z.object({
        ...contractFields,
        attachment: attachmentInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { attachment, startDate, endDate, ...rest } = input;

      const contract = await ctx.db.financialContract.create({
        data: {
          ...rest,
          startDate: toDate(startDate),
          endDate: toDate(endDate),
          createdByProfileId: ctx.profile.id,
        },
      });

      if (attachment) {
        // 1) Registrer i dokumentarkivet (én fil, to DB-rader).
        let documentId: string | undefined;
        try {
          const doc = await ctx.db.document.create({
            data: {
              title: `Kontrakt: ${contract.name}`,
              category: "OTHER",
              tags: ["økonomikontrakt", "okonomikontrakt"],
              filePath: attachment.filePath,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              visibility: "PRIVATE",
              ownerId: ctx.profile.id,
            },
          });
          documentId = doc.id;
        } catch {
          // Dokumentarkivet er valgfritt – fortsett uten ved feil.
          documentId = undefined;
        }

        // 2) Lag vedlegg knyttet til kontrakten.
        await ctx.db.financialContractAttachment.create({
          data: {
            financialContractId: contract.id,
            documentId,
            fileName: attachment.fileName,
            filePath: attachment.filePath,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            uploadedByProfileId: ctx.profile.id,
          },
        });
      }

      await ctx.db.auditLog.create({
        data: {
          entityType: "FinancialContract",
          entityId: contract.id,
          action: "FINANCIAL_CONTRACT_CREATE",
          actorId: ctx.profile.id,
          metadata: { name: contract.name, type: contract.type },
        },
      });

      return contract;
    }),

  // ── update ────────────────────────────────────────────────────────────────
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: contractFields.name.optional(),
        contractNumber: contractFields.contractNumber,
        type: z.enum(CONTRACT_TYPES).optional(),
        supplierName: contractFields.supplierName.optional(),
        locationId: contractFields.locationId,
        centerName: contractFields.centerName,
        areaSqm: contractFields.areaSqm,
        startDate: contractFields.startDate,
        endDate: contractFields.endDate,
        durationMonths: contractFields.durationMonths,
        monthlyAmount: contractFields.monthlyAmount,
        annualAmount: contractFields.annualAmount,
        totalValue: contractFields.totalValue,
        currency: z.string().max(8).optional(),
        status: z.enum(CONTRACT_STATUSES).optional(),
        renewalOption: z.boolean().optional(),
        noticePeriodMonths: contractFields.noticePeriodMonths,
        description: contractFields.description,
        notes: contractFields.notes,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startDate, endDate, ...rest } = input;

      const existing = await ctx.db.financialContract.findUnique({ where: { id } });
      if (!existing)
        throw new TRPCError({ code: "NOT_FOUND", message: "Kontrakt ikke funnet." });

      const updated = await ctx.db.financialContract.update({
        where: { id },
        data: {
          ...rest,
          ...(startDate !== undefined ? { startDate: toDate(startDate) } : {}),
          ...(endDate !== undefined ? { endDate: toDate(endDate) } : {}),
        },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "FinancialContract",
          entityId: id,
          action: "FINANCIAL_CONTRACT_UPDATE",
          actorId: ctx.profile.id,
          metadata: { updatedFields: Object.keys(rest) },
        },
      });

      return updated;
    }),

  // ── terminate ──────────────────────────────────────────────────────────────
  terminate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.financialContract.findUnique({
        where: { id: input.id },
      });
      if (!existing)
        throw new TRPCError({ code: "NOT_FOUND", message: "Kontrakt ikke funnet." });

      const updated = await ctx.db.financialContract.update({
        where: { id: input.id },
        data: { status: "TERMINATED", terminatedAt: new Date() },
      });

      await ctx.db.auditLog.create({
        data: {
          entityType: "FinancialContract",
          entityId: input.id,
          action: "FINANCIAL_CONTRACT_TERMINATE",
          actorId: ctx.profile.id,
        },
      });

      return updated;
    }),

  // ── getUploadUrl ────────────────────────────────────────────────────────────
  getUploadUrl: adminProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.literal("application/pdf"),
        sizeBytes: z.number().int().positive().max(MAX_PDF_BYTES, {
          message: "Maks filstørrelse er 20 MB",
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rate = uploadUrlLimit(ctx.profile.id);
      if (!rate.allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "For mange opplastinger. Prøv igjen om litt.",
        });

      const safe = sanitizeFileName(input.fileName);
      const filePath = `financial-contracts/${createId()}/${Date.now()}-${safe}`;

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(FINANCIAL_CONTRACTS_BUCKET)
        .createSignedUploadUrl(filePath, { upsert: false });

      if (error || !data)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke opprette opplastings-URL: ${
            error?.message ?? "ukjent feil"
          }`,
        });

      return { signedUrl: data.signedUrl, token: data.token, filePath };
    }),

  // ── getAttachmentUrl ─────────────────────────────────────────────────────────
  getAttachmentUrl: adminProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const att = await ctx.db.financialContractAttachment.findUnique({
        where: { id: input.attachmentId },
      });
      if (!att)
        throw new TRPCError({ code: "NOT_FOUND", message: "Vedlegg ikke funnet." });

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(FINANCIAL_CONTRACTS_BUCKET)
        .createSignedUrl(att.filePath, 300);

      if (error || !data)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke generere nedlastings-URL: ${
            error?.message ?? "ukjent feil"
          }`,
        });

      return { signedUrl: data.signedUrl, fileName: att.fileName };
    }),

  // ── extractFromUpload (AI) ───────────────────────────────────────────────────
  extractFromUpload: adminProcedure
    .input(z.object({ filePath: z.string().min(1).max(500) }))
    .mutation(async ({ input }): Promise<ExtractedFinancialContract> => {
      if (!isFinancialContractAiEnabled()) return {};

      const admin = createAdminClient();
      const { data, error } = await admin.storage
        .from(FINANCIAL_CONTRACTS_BUCKET)
        .download(input.filePath);

      if (error || !data)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Kunne ikke lese fil: ${error?.message ?? "ukjent feil"}`,
        });

      const arrayBuffer = await data.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return extractFinancialContract(base64);
    }),
});
