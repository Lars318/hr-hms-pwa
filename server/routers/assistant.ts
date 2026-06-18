import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { askAssistant } from "@/server/assistant/provider";

const BLOCKED_KEYWORDS = [
  "personnelsak", "varslingssak", "fløyteblåser", "lønn", "salary",
  "sensitiv", "konfidensiell", "pasientdata", "personnummer",
];

export const assistantRouter = router({
  ask: profileProcedure
    .input(
      z.object({
        question: z.string().min(2).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const q = input.question.toLowerCase();
      for (const kw of BLOCKED_KEYWORDS) {
        if (q.includes(kw)) {
          return {
            answer:
              "Dette spørsmålet berører sensitiv informasjon som jeg ikke kan hjelpe med. Kontakt HR direkte.",
            usedAi: false,
            sources: [],
            suggestedLinks: [],
          };
        }
      }

      // Fetch relevant handbook sections (title + content, max 5 chunks)
      const sections = await ctx.db.handbookSection.findMany({
        where: {
          OR: input.question
            .split(/\s+/)
            .filter((w) => w.length > 3)
            .slice(0, 6)
            .map((word) => ({
              OR: [
                { title: { contains: word, mode: "insensitive" as const } },
                { content: { contains: word, mode: "insensitive" as const } },
              ],
            })),
        },
        select: { title: true, content: true },
        take: 5,
        orderBy: { order: "asc" },
      });

      const chunks = sections.map((s) => ({
        title: s.title,
        content: s.content.slice(0, 800),
      }));

      return askAssistant(input.question, ctx.profile.role, chunks);
    }),
});
