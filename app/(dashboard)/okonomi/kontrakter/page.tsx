import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { FinancialContractDashboard } from "@/features/financial-contracts/FinancialContractDashboard";

export const metadata = { title: "Kontrakter (Økonomi) – Truls HR" };

export default async function OkonomiKontrakterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({
    where: { supabaseUserId: user.id },
  });
  if (!profile) redirect("/ingen-tilgang");

  // Admin-only modul.
  if (profile.role !== "ADMIN") redirect("/ingen-tilgang");

  return <FinancialContractDashboard />;
}
