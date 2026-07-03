import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc/context";

// AI-strukturering av personalhåndbok kan ta tid — hev grensen fra 30s.
export const maxDuration = 60;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ error }) => console.error("tRPC error:", error)
        : undefined,
  });

export { handler as GET, handler as POST };
