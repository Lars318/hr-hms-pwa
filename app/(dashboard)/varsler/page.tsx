import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NotificationList } from "@/features/notifications/NotificationList";
import { PushNotificationSettings } from "@/features/pwa/PushNotificationSettings";

export const metadata = { title: "Varsler – HR/HMS" };

export default async function VarslerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Varsler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alle varsler om avvik, tiltak, dokumenter og risikovurderinger
        </p>
      </div>
      <PushNotificationSettings />
      <NotificationList />
    </div>
  );
}
