import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

const AVATAR_BUCKET = "profiles";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const profileId = formData.get("profileId") as string | null;

  if (!file || !profileId) return Response.json({ error: "Mangler fil eller profileId" }, { status: 400 });

  // Kun admin/HR kan endre andres avatar; alle kan endre sin egen
  const isOwnProfile = viewer.id === profileId;
  const canEdit = isOwnProfile || viewer.role === "ADMIN" || viewer.role === "HR";
  if (!canEdit) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!file.type.startsWith("image/")) return Response.json({ error: "Kun bilder er tillatt" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "Bildet må være under 5 MB" }, { status: 400 });

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  // Cache-buster i banen så nettleseren henter det nye bildet.
  const path = `avatars/${profileId}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  // Bruk service-role-klienten så opplasting ikke blokkeres av storage-RLS.
  const admin = createAdminClient();

  const doUpload = () =>
    admin.storage.from(AVATAR_BUCKET).upload(path, bytes, { contentType: file.type, upsert: true });

  let { error: uploadError } = await doUpload();
  // Opprett bøtta automatisk (offentlig) hvis den mangler, og prøv på nytt.
  if (uploadError && /bucket|not.?found|does not exist/i.test(uploadError.message)) {
    await admin.storage.createBucket(AVATAR_BUCKET, { public: true }).catch(() => {});
    ({ error: uploadError } = await doUpload());
  }
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  await db.profile.update({ where: { id: profileId }, data: { avatarUrl: publicUrl } });

  return Response.json({ ok: true, avatarUrl: publicUrl });
}
