import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NewCaseForm } from "@/features/whistleblowing/NewCaseForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nytt varsel – HR/HMS" };

export default async function NyVarslingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const [locations, departments] = await Promise.all([
    db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/varsling" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Tilbake til varsling
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Send varsel om kritikkverdig forhold</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Saken behandles konfidensielt av HR og administrator.
        </p>
      </div>
      <NewCaseForm locations={locations} departments={departments} />
    </div>
  );
}
