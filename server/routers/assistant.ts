import { z } from "zod";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { ask } from "@/server/assistant/provider";

export const assistantRouter = router({
  ask: profileProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
        currentPath: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ask(input.message, ctx.profile.role);
    }),
});
