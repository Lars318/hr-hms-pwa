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

  const { email } = await request.json() as { email: string };
  if (!email) return Response.json({ error: "Mangler e-post" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "missing env vars" }, { status: 500 });
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey,
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let errMsg = `GoTrue error ${res.status}`;
    try { const j = JSON.parse(errText); errMsg = j.msg ?? j.message ?? errMsg; } catch {}
    return Response.json({ error: errMsg }, { status: res.status });
  }

  const data = await res.json() as { action_link?: string; properties?: { action_link?: string } };
  const link = data.action_link ?? data.properties?.action_link;

  if (!link) return Response.json({ error: "Fikk ikke lenke fra Supabase" }, { status: 500 });

  return Response.json({ ok: true, link });
}
