import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    profile = await db.profile.findUnique({
      where: { supabaseUserId: user.id },
      include: { department: true },
    });
  }

  return { supabase, user, profile, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
