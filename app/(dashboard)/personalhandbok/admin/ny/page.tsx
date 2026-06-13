import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { HandbookCategoryForm } from "@/features/handbook/HandbookCategoryForm";

export const metadata = { title: "Nytt kapittel – Personalhåndbok" };

export default async function NyttKapittelPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) {
    redirect("/ingen-tilgang");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/personalhandbok/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:underline mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Administrer personalhåndbok
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nytt kapittel</h1>
      </div>
      <HandbookCategoryForm mode="create" />
    </div>
  );
}
