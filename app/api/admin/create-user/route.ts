import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || profile.role !== "ADMIN" && profile.role !== "HR") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, password, fullName, title, phone, role, departmentId, locationIds, primaryLocationId } =
    await request.json() as {
      email: string; password: string; fullName: string;
      title?: string; phone?: string; role: string; departmentId?: string;
      locationIds?: string[]; primaryLocationId?: string;
    };

  if (!email || !password || !fullName || password.length < 8) {
    return Response.json({ error: "Mangler påkrevde felt eller passordet er for kort." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "missing env vars" }, { status: 500 });
  }

  // Create Auth user via GoTrue Admin API
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({}));
    return Response.json({ error: err.msg ?? err.message ?? `Feil ved oppretting av bruker (${authRes.status})` }, { status: authRes.status });
  }

  const authUser = await authRes.json() as { id: string };

  // Create Profile
  try {
    const newProfile = await db.profile.create({
      data: {
        supabaseUserId: authUser.id,
        email,
        fullName,
        title: title || null,
        phone: phone || null,
        role: role as "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE",
        departmentId: departmentId || null,
      },
    });
    // Create location assignments if provided
    if (locationIds && locationIds.length > 0) {
      await db.profileAssignment.createMany({
        data: locationIds.map((locationId, i) => ({
          profileId: newProfile.id,
          locationId,
          isPrimary: primaryLocationId ? locationId === primaryLocationId : i === 0,
          startDate: new Date(),
        })),
      });
    }

    return Response.json({ ok: true, profileId: newProfile.id });
  } catch (err) {
    // Rollback: delete auth user if profile creation fails
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${serviceRoleKey}`, "apikey": serviceRoleKey },
    });
    return Response.json({ error: err instanceof Error ? err.message : "Feil ved oppretting av profil" }, { status: 500 });
  }
}
