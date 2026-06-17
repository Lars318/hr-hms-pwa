import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(supabaseUserId, { password });
  if (error) return Response.json({ error: error.message, code: error.status, details: JSON.stringify(error) }, { status: 500 });
  if (!data?.user) return Response.json({ error: "no user returned" }, { status: 500 });

  return Response.json({ ok: true });
}
