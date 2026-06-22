/**
 * Oppretter manglende Supabase Auth-brukere for testprofiler og
 * kobler dem til Profile-tabellen via supabaseUserId.
 * Bruker kun Supabase Admin API — ingen DATABASE_URL nødvendig.
 *
 * Kjør med: node scripts/create-test-users.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEST_USERS = [
  { email: "testhr@pulsfollo.no",     password: "TestHR123!" },
  { email: "testleder@pulsfollo.no",  password: "TestLeder123!" },
];

async function main() {
  console.log("Oppretter / henter testbrukere i Supabase Auth...\n");

  // Hent alle eksisterende brukere
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingMap = Object.fromEntries(existing.users.map((u) => [u.email, u.id]));

  const results = [];

  for (const { email, password } of TEST_USERS) {
    let userId;

    if (existingMap[email]) {
      userId = existingMap[email];
      console.log(`✓ Finnes allerede: ${email} (${userId})`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        console.error(`✗ Feil ved opprettelse av ${email}:`, error.message);
        continue;
      }

      userId = data.user.id;
      console.log(`+ Opprettet: ${email} (${userId})`);
    }

    results.push({ email, userId });
  }

  // Oppdater Profile-tabellen via Supabase REST (ingen Prisma)
  console.log("\nKobler brukere til profiler i databasen...\n");

  for (const { email, userId } of results) {
    const { data, error } = await supabase
      .from("Profile")
      .update({ supabaseUserId: userId })
      .eq("email", email)
      .select("fullName, role");

    if (error) {
      console.error(`✗ Feil ved oppdatering av ${email}:`, error.message);
    } else if (!data?.length) {
      console.log(`  ⚠ Ingen profil funnet for ${email}`);
    } else {
      console.log(`  ✓ ${data[0].fullName} (${data[0].role}) koblet til ${userId}`);
    }
  }

  console.log("\nFerdig!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
