import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getRpConfig, CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const profile = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
    include: { webAuthnCredentials: { select: { credentialId: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const { rpID, rpName } = getRpConfig(req.url);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: profile.email,
    userDisplayName: profile.fullName,
    attestationType: "none",
    excludeCredentials: profile.webAuthnCredentials.map((c) => ({
      id: c.credentialId,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const response = NextResponse.json(options);
  response.cookies.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60,
    path: "/",
  });
  return response;
}
