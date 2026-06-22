// Supabase-js reads process.version to detect runtime environment.
// Vercel Edge Runtime exposes `process` but not `process.version`, causing a
// runtime crash. Polyfill before any Supabase module is imported.
if (typeof process !== "undefined" && !process.version) {
  (process as NodeJS.Process).version = "v18.0.0";
}

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
