import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Mangler email" }, { status: 400 });

  // Verify current user is ADMIN
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const caller = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { role: true },
  });
  if (caller?.role !== "ADMIN") {
    return NextResponse.json({ error: "Kun ADMIN kan bytte bruker" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Invalidate current user's session server-side
  await admin.auth.admin.signOut(user.id, "global");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hr-hms-fuvkodkrg-larshenrik-9900s-projects.vercel.app";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Kunne ikke generere lenke" }, { status: 500 });
  }

  // Redirect to magic link and clear all sb-* auth cookies from the request
  const response = NextResponse.redirect(data.properties.action_link, { status: 302 });

  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }

  return response;
}
