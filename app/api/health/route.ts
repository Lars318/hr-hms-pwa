import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  // Database connectivity check
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const httpStatus = status === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      environment: process.env.NODE_ENV ?? "unknown",
      uptime: process.uptime(),
      db: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      latencyMs: Date.now() - start,
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
