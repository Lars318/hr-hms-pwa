"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

export async function impersonateUser(targetEmail: string): Promise<{ url: string }> {
  // Verify caller is ADMIN
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke innlogget");

  const caller = await db.profile.findUnique({ where: { supabaseUserId: user.id }, select: { role: true } });
  if (caller?.role !== "ADMIN") throw new Error("Kun ADMIN kan bytte bruker");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message ?? "Kunne ikke generere innloggingslenke");
  }

  return { url: data.properties.action_link };
}
