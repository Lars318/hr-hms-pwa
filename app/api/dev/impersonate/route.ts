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

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message ?? "Kunne ikke generere lenke" },
      { status: 500 }
    );
  }

  // Redirect nettleseren til vår egen callback med token_hash.
  // Callback-ruten kjører verifyOtp i sin egen request-kontekst og setter
  // session-cookies naturlig — ingen server-side cookie-manipulasjon nødvendig.
  const callbackUrl = new URL("/auth/callback", req.url);
  callbackUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
  callbackUrl.searchParams.set("type", "magiclink");
  callbackUrl.searchParams.set("next", "/dashboard");

  return NextResponse.redirect(callbackUrl);
}
