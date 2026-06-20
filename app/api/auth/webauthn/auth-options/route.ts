import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { getRpConfig, CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Mangler e-post" }, { status: 400 });

    const profile = await db.profile.findUnique({
      where: { email },
      include: { webAuthnCredentials: { select: { credentialId: true } } },
    });

    if (!profile) {
      return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
    }
    if (profile.webAuthnCredentials.length === 0) {
      return NextResponse.json({ error: "Ingen passkey registrert for denne brukeren" }, { status: 404 });
    }

    const { rpID } = getRpConfig(req.url);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: profile.webAuthnCredentials.map((c) => ({ id: c.credentialId })),
      userVerification: "preferred",
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
  } catch (e) {
    console.error("[webauthn/auth-options]", e);
    return NextResponse.json({ error: "Serverfeil ved passkey-innlogging" }, { status: 500 });
  }
}
