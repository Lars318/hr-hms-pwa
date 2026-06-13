import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, profileProcedure } from "@/server/trpc/trpc";
import { runReport } from "@/lib/reports/queries";
import type { ReportType } from "@/lib/reports/queries";

const reportInput = z.object({
  type: z.enum(["incidents", "actions", "risk", "documents", "leave", "handbook", "overtime"]),
  from: z.string().optional(),
  to: z.string().optional(),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
});

export const reportRouter = router({
  query: profileProcedure
    .input(reportInput)
    .query(async ({ ctx, input }) => {
      const { profile, db } = ctx;
      if (profile.role === "EMPLOYEE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ingen tilgang til rapporter." });
      }
      return runReport(input.type as ReportType, db, profile, {
        from: input.from,
        to: input.to,
        departmentId: input.departmentId,
        locationId: input.locationId,
      });
    }),
});
