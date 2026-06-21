import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Mangler email" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const caller = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    select: { role: true },
  });
  if (caller?.role !== "ADMIN") {
    return NextResponse.json({ error: "Kun ADMIN kan bytte bruker" }, { status: 403 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://hr-hms-fuvkodkrg-larshenrik-9900s-projects.vercel.app";

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? "Kunne ikke generere lenke" },
      { status: 500 }
    );
  }

  // Returner action_link som JSON — klienten gjør window.location.href direkte til Supabase.
  // Dette er identisk med å klikke en magic link i e-post, og lar nettleseren håndtere
  // session-cookies uten server-side manipulasjon.
  return NextResponse.json({ actionLink: linkData.properties.action_link });
}
