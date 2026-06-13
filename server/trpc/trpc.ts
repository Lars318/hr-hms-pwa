import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Krever innlogget Supabase-bruker
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Krever Profile i databasen
export const profileProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.profile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brukerprofil mangler – kontakt administrator.",
    });
  }
  return next({ ctx: { ...ctx, profile: ctx.profile } });
});

// Krever rolle HR eller ADMIN
export const hrProcedure = profileProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== "ADMIN" && ctx.profile.role !== "HR") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Krever HR- eller administrator-tilgang.",
    });
  }
  return next({ ctx });
});

// Krever rolle ADMIN
export const adminProcedure = profileProcedure.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Krever administrator-tilgang.",
    });
  }
  return next({ ctx });
});
