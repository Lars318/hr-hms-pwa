export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { getRpConfig, CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const { rpID } = getRpConfig(req.url);

    // Ingen allowCredentials = discoverable credentials.
    // Enheten viser alle passkeys for dette domenet — brukeren trenger ikke oppgi e-post.
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [],
      userVerification: "required",
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
