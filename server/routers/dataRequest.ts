import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";

const REQUEST_TYPES = ["ACCESS", "PORTABILITY", "RECTIFICATION", "ERASURE", "OTHER"] as const;
const REQUEST_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"] as const;

export const dataRequestRouter = router({
  mine: profileProcedure.query(async ({ ctx }) => {
    return ctx.db.dataSubjectRequest.findMany({
      where: { requesterId: ctx.profile.id },
      include: { handledBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  list: hrProcedure
    .input(z.object({ status: z.enum(REQUEST_STATUSES).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.dataSubjectRequest.findMany({
        where: { ...(input?.status ? { status: input.status } : {}) },
        include: {
          requester: { select: { id: true, fullName: true, email: true } },
          handledBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: profileProcedure
    .input(z.object({
      type: z.enum(REQUEST_TYPES),
      message: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.dataSubjectRequest.create({
        data: {
          type: input.type,
          message: input.message,
          requesterId: ctx.profile.id,
        },
      });

      // Nøytralt varsel til HR/ADMIN — ingen sensitiv tekst
      await createNotificationsForRoles({
        db: ctx.db,
        roles: ["HR", "ADMIN"],
        type: "DATA_REQUEST_RECEIVED",
        title: "Ny datainnsyn-forespørsel",
        message: "En ansatt har sendt inn en forespørsel om innsyn/eksport av personopplysninger.",
        linkUrl: `/personvern/foresporsler/${request.id}`,
      });

      return request;
    }),

  updateStatus: hrProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(REQUEST_STATUSES),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.dataSubjectRequest.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const request = await ctx.db.dataSubjectRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          adminNote: input.adminNote,
          handledById: ctx.profile.id,
          completedAt: input.status === "COMPLETED" || input.status === "REJECTED" ? new Date() : null,
        },
      });

      // Varsle ansatt når ferdigbehandlet — nøytral tekst
      if (input.status === "COMPLETED" || input.status === "REJECTED") {
        const statusText = input.status === "COMPLETED" ? "behandlet" : "avslått";
        await createNotification({
          db: ctx.db,
          recipientId: existing.requesterId,
          type: "DATA_REQUEST_COMPLETED",
          title: "Din forespørsel er behandlet",
          message: `Din forespørsel om personopplysninger er ${statusText}. Kontakt HR for mer informasjon.`,
          linkUrl: "/personvern/mine-foresporsler",
        });
      }

      return request;
    }),

  openCount: hrProcedure.query(async ({ ctx }) => {
    return ctx.db.dataSubjectRequest.count({ where: { status: "PENDING" } });
  }),
});
