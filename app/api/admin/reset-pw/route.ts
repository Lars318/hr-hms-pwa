import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || profile.role !== "ADMIN") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { supabaseUserId, password } = await request.json() as { supabaseUserId: string; password: string };
  if (!supabaseUserId || !password || password.length < 8) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "missing env vars" }, { status: 500 });
  }

  // Call GoTrue Admin API directly
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${supabaseUserId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey,
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[reset-pw] GoTrue error", res.status, supabaseUrl, supabaseUserId.slice(0, 8), errText);
    let errMsg = `GoTrue error ${res.status}`;
    try { const j = JSON.parse(errText); errMsg = j.msg ?? j.message ?? errMsg; } catch {}
    return Response.json({ error: errMsg, debug: { status: res.status, urlProject: supabaseUrl?.split(".")[0]?.split("//")[1] } }, { status: res.status });
  }

  return Response.json({ ok: true });
}
