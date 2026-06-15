import { z } from "zod";
import { router, hrProcedure, profileProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { createNotification } from "@/lib/notifications";
import { mockSigningProvider } from "@/lib/esignering/mockAdapter";

export const signatureRouter = router({
  // HR creates a signature request for a contract
  requestSignature: hrProcedure
    .input(z.object({
      contractId: z.string(),
      signerId: z.string(),    // employee profile ID
      expiresInDays: z.number().int().min(1).max(90).default(30),
    }))
    .mutation(async ({ input }) => {
      const contract = await db.contract.findUnique({
        where: { id: input.contractId },
        include: { employee: { select: { fullName: true, email: true } } },
      });
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
      if (!contract.fileKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Last opp kontraktsfil før du ber om signatur." });
      }

      const signer = await db.profile.findUnique({
        where: { id: input.signerId },
        select: { fullName: true, email: true },
      });
      if (!signer) throw new TRPCError({ code: "NOT_FOUND", message: "Signatarbruker ikke funnet." });

      const { externalId, expiresAt } = await mockSigningProvider.initiateRequest({
        signerEmail: signer.email,
        signerName: signer.fullName,
        documentTitle: contract.title,
        documentKey: contract.fileKey ?? "",
        expiresInDays: input.expiresInDays,
      });

      const sigRequest = await db.signatureRequest.create({
        data: {
          contractId: input.contractId,
          signerId: input.signerId,
          externalId,
          expiresAt,
          provider: "MOCK",
        },
      });

      await createNotification({
        db,
        recipientId: input.signerId,
        type: "SIGNATURE_REQUESTED",
        title: "Signatur forespurt",
        message: `Du er bedt om å signere: ${contract.title}.`,
        linkUrl: `/kontrakter/${input.contractId}`,
      });

      return sigRequest;
    }),

  // Employee signs (mock: just records the action)
  sign: profileProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const req = await db.signatureRequest.findUnique({
        where: { id: input },
        include: { contract: { select: { title: true } } },
      });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (req.signerId !== ctx.profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (req.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Denne forespørselen er allerede behandlet." });

      const updated = await db.signatureRequest.update({
        where: { id: input },
        data: { status: "SIGNED", signedAt: new Date() },
      });

      await createNotification({
        db,
        recipientId: ctx.profile.id,
        type: "SIGNATURE_COMPLETED",
        title: "Kontrakt signert",
        message: `Du har signert: ${req.contract.title}.`,
        linkUrl: `/kontrakter/${req.contractId}`,
      });

      return updated;
    }),

  // Employee rejects
  reject: profileProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const req = await db.signatureRequest.findUnique({ where: { id: input } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (req.signerId !== ctx.profile.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (req.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST" });

      return db.signatureRequest.update({
        where: { id: input },
        data: { status: "REJECTED", rejectedAt: new Date() },
      });
    }),

  // List signature requests for a contract (HR/ADMIN)
  listForContract: hrProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return db.signatureRequest.findMany({
        where: { contractId: input },
        include: { signer: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Pending requests for the current user (EMPLOYEE)
  myPending: profileProcedure
    .query(async ({ ctx }) => {
      return db.signatureRequest.findMany({
        where: { signerId: ctx.profile.id, status: "PENDING" },
        include: { contract: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),
});
