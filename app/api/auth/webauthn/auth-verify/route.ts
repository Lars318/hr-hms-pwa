import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { getRpConfig, CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const challenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
    if (!challenge) return NextResponse.json({ error: "Ugyldig sesjon" }, { status: 400 });

    const body = await req.json();
    const { authResponse } = body;
    if (!authResponse?.id) {
      return NextResponse.json({ error: "Mangler data" }, { status: 400 });
    }

    // Slå opp credential direkte — ingen e-post nødvendig
    const credential = await db.webAuthnCredential.findUnique({
      where: { credentialId: authResponse.id },
      include: { profile: true },
    });
    if (!credential) return NextResponse.json({ error: "Passkey ikke funnet" }, { status: 404 });

    const { rpID, origin } = getRpConfig(req.url);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credential.credentialId,
          publicKey: new Uint8Array(credential.publicKey),
          counter: Number(credential.counter),
        },
      });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "Verifisering feilet" }, { status: 400 });
    }

    await db.webAuthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    const admin = createAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: credential.profile.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: linkError?.message ?? "Kunne ikke opprette sesjon" },
        { status: 500 }
      );
    }

    // Return callback URL — nettleseren navigerer dit som full page load,
    // slik at /auth/callback setter cookies naturlig (samme mønster som impersonering).
    const callbackUrl = new URL("/auth/callback", req.url);
    callbackUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
    callbackUrl.searchParams.set("type", "magiclink");
    callbackUrl.searchParams.set("next", "/dashboard");

    const response = NextResponse.json({ verified: true, callbackUrl: callbackUrl.toString() });
    response.cookies.set(CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (e) {
    console.error("[webauthn/auth-verify]", e);
    return NextResponse.json({ error: "Serverfeil ved verifisering" }, { status: 500 });
  }
}
