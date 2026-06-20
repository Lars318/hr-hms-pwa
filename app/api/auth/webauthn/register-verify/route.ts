import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getRpConfig, CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const challenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!challenge) return NextResponse.json({ error: "Ugyldig sesjon" }, { status: 400 });

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req.url);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verifisering feilet" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  await db.webAuthnCredential.create({
    data: {
      profileId: profile.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
    },
  });

  const response = NextResponse.json({ verified: true });
  response.cookies.set(CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
