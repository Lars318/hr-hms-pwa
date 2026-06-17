import { createAdminClient } from "@/lib/supabase/admin";

// Temporary route – delete after use
export async function POST(request: Request) {
  const secret = request.headers.get("x-reset-secret");
  if (secret !== process.env.RESET_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId, password } = await request.json() as { userId: string; password: string };
  if (!userId || !password || password.length < 8) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
