import { NextResponse, type NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/update-password",
  "/auth/session",
  "/api/health",
];

/**
 * Decode a Supabase session JWT without using any Node.js APIs.
 * Returns the payload or null if the token is missing / expired / malformed.
 * Safe for Vercel Edge Runtime (only uses atob and JSON.parse).
 */
function getSessionFromCookies(request: NextRequest): { exp: number } | null {
  // Supabase stores the session in a cookie named sb-<project_ref>-auth-token
  // or sb-<project_ref>-auth-token.0 (chunked) — check all cookies for the pattern.
  const sessionCookie = request.cookies.getAll().find(
    (c) => /^sb-.+-auth-token(\.0)?$/.test(c.name)
  );
  if (!sessionCookie) return null;

  try {
    // The cookie value is a JSON string: {"access_token":"...","..."}
    // or a raw JWT depending on the @supabase/ssr version.
    let raw = sessionCookie.value;

    // Try JSON first (newer @supabase/ssr serialises the whole session object)
    if (raw.startsWith("{") || raw.startsWith("%7B")) {
      raw = decodeURIComponent(raw);
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed.access_token) raw = parsed.access_token;
      else return null;
    }

    // raw should now be a JWT (header.payload.signature)
    const parts = raw.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64 → JSON
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64));
    return json as { exp: number };
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Forward magic link / PKCE auth params to the callback handler.
  // Supabase sends users back with ?code= or ?token_hash= — these arrive
  // before any session cookie exists, so we must route them to auth/callback
  // before checking authentication.
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  if ((code || tokenHash) && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.has("next")) url.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(url);
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const session = getSessionFromCookies(request);
  const now = Math.floor(Date.now() / 1000);
  const isAuthenticated = session !== null && session.exp > now - 60;

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
