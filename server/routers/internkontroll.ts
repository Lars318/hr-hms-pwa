import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { db } from "@/lib/db";
import { addDays, differenceInDays } from "date-fns";

function beregnStatus(nesteFrist: Date | null): "OK" | "FORFALLER_SNART" | "FORFALT" | "IKKE_SATT" {
  if (!nesteFrist) return "IKKE_SATT";
  const dager = differenceInDays(nesteFrist, new Date());
  if (dager < 0) return "FORFALT";
  if (dager <= 30) return "FORFALLER_SNART";
  return "OK";
}

export const internkontrollRouter = router({
  // Alle områder med siste logg og beregnet status
  listeOmrader: profileProcedure
    .input(z.object({ locationId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const omrader = await db.internkontrollOmrade.findMany({
        where: input?.locationId ? { locationId: input.locationId } : undefined,
        include: {
          ansvarlig: { select: { id: true, fullName: true, avatarUrl: true } },
          logg: {
            orderBy: { utfortDato: "desc" },
            take: 1,
          },
        },
        orderBy: { kategori: "asc" },
      });

      return omrader.map((o) => ({
        ...o,
        sisteLogg: o.logg[0] ?? null,
        status: beregnStatus(o.logg[0]?.nesteFrist ?? null),
        dagerTilFrist: o.logg[0]?.nesteFrist
          ? differenceInDays(o.logg[0].nesteFrist, new Date())
          : null,
      }));
    }),

  hentOmrade: profileProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.internkontrollOmrade.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          ansvarlig: { select: { id: true, fullName: true, avatarUrl: true } },
          logg: {
            orderBy: { utfortDato: "desc" },
            include: { utfortAv: { select: { id: true, fullName: true } } },
          },
        },
      });
    }),

  opprettOmrade: profileProcedure
    .input(z.object({
      kategori: z.enum(["BRANNVERN", "EL_SIKKERHET", "ARBEIDSMILJO", "KJORETOY", "STOFFKARTOTEK", "ANNET"]),
      tittel: z.string().min(2),
      beskrivelse: z.string().optional(),
      intervalDager: z.number().min(1),
      ansvarligId: z.string().optional(),
      locationId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.internkontrollOmrade.create({ data: input });
    }),

  registrerKontroll: profileProcedure
    .input(z.object({
      omradeId: z.string(),
      utfortDato: z.string(),
      godkjent: z.boolean().default(true),
      merknad: z.string().optional(),
      dokumentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const omrade = await db.internkontrollOmrade.findUniqueOrThrow({
        where: { id: input.omradeId },
      });

      const utfortDato = new Date(input.utfortDato);
      const nesteFrist = addDays(utfortDato, omrade.intervalDager);

      return db.internkontrollLogg.create({
        data: {
          omradeId: input.omradeId,
          utfortAvId: ctx.profile.id,
          utfortDato,
          nesteFrist,
          godkjent: input.godkjent,
          merknad: input.merknad,
          dokumentUrl: input.dokumentUrl,
        },
      });
    }),

  slettOmrade: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.internkontrollOmrade.delete({ where: { id: input.id } });
    }),

  // Oversikt: antall per status
  statusOversikt: profileProcedure.query(async () => {
    const omrader = await db.internkontrollOmrade.findMany({
      include: { logg: { orderBy: { utfortDato: "desc" }, take: 1 } },
    });

    const statuser = omrader.map((o) => beregnStatus(o.logg[0]?.nesteFrist ?? null));
    return {
      total: omrader.length,
      ok: statuser.filter((s) => s === "OK").length,
      forfaller: statuser.filter((s) => s === "FORFALLER_SNART").length,
      forfalt: statuser.filter((s) => s === "FORFALT").length,
      ikkeSatt: statuser.filter((s) => s === "IKKE_SATT").length,
    };
  }),
});
