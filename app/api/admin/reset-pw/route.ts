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
    const err = await res.json().catch(() => ({}));
    return Response.json({ error: err.msg ?? err.message ?? `GoTrue error ${res.status}` }, { status: res.status });
  }

  return Response.json({ ok: true });
}
