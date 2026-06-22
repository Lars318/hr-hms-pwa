import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase.auth.admin.updateUserById(
  "e0354c99-3f4c-435c-b518-7f263bf752f5",
  {
    password: "TrulsAdmin123!",
    email_confirm: true,
  }
);

if (error) {
  console.error("Feil:", error.message);
} else {
  console.log("✓ Passord og e-postbekreftelse oppdatert");
  console.log("  email:", data.user.email);
  console.log("  confirmed:", data.user.email_confirmed_at);
}
