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

  // Invalidate current user's session server-side
  const admin = createAdminClient();
  await admin.auth.admin.signOut(user.id, "global");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hr-hms-pwa.vercel.app";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Kunne ikke generere lenke" }, { status: 500 });
  }

  const magicLink = data.properties.action_link;

  // Return HTML that clears all sb-* cookies client-side, then follows the magic link
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Bytter bruker…</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <p style="color:#666">Bytter bruker…</p>
  <script type="module">
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
    const sb = createClient(${JSON.stringify(supabaseUrl)}, ${JSON.stringify(supabaseAnonKey)});
    await sb.auth.signOut({ scope: 'local' });
    window.location.href = ${JSON.stringify(magicLink)};
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
