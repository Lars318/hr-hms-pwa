import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "magiclink" | "recovery" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Detect password recovery flow via AMR (authentication method reference)
      const amr = data.session?.user?.app_metadata?.amr as Array<{ method: string }> | undefined
        ?? (data.session as unknown as { amr?: Array<{ method: string }> })?.amr;
      const isRecovery = Array.isArray(amr) && amr.some((m) => m.method === "recovery");
      const destination = isRecovery ? "/auth/update-password" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const destination = type === "recovery" ? "/auth/update-password" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
