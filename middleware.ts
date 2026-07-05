import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Ekskluder også PWA-filer (service worker + workbox) så de serveres direkte
    // som JS og ikke omdirigeres til /login — ellers kan ikke appen installeres.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-|worker-|fallback-|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
