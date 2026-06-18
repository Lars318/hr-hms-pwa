import { z } from "zod";
import { router, profileProcedure, hrProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const announcementRouter = router({
  list: profileProcedure.query(async ({ ctx }) => {
    const { profile, db } = ctx;
    const now = new Date();

    const announcements = await db.announcement.findMany({
      where: {
        publishedAt: { lte: now },
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ target: "ALL" }, { target: "DEPARTMENT", departmentId: profile.departmentId }] },
        ],
      },
      include: { author: { select: { fullName: true, title: true, avatarUrl: true } } },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    return announcements;
  }),

  create: hrProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        target: z.enum(["ALL", "DEPARTMENT", "LOCATION"]).default("ALL"),
        departmentId: z.string().optional(),
        locationId: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profile, db } = ctx;

      return db.announcement.create({
        data: {
          id: crypto.randomUUID(),
          title: input.title,
          body: input.body,
          target: input.target,
          departmentId: input.departmentId ?? null,
          locationId: input.locationId ?? null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          authorId: profile.id,
          updatedAt: new Date(),
        },
      });
    }),

  delete: hrProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const ann = await db.announcement.findUnique({ where: { id: input.id } });
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" });
      await db.announcement.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
