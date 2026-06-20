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

  // Generate magic link for target user
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hr-hms-pwa.vercel.app";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Kunne ikke generere lenke" }, { status: 500 });
  }

  // Sign out current session, then redirect to magic link
  // The response clears the auth cookies before the browser follows the redirect
  const response = NextResponse.redirect(data.properties.action_link, { status: 302 });
  response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });

  return response;
}
