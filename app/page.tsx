import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/features/marketing/LandingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Innloggede brukere går rett til appen; andre ser landingssiden.
  if (user) redirect("/dashboard");

  return <LandingPage />;
}
