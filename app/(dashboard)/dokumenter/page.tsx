import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DocumentListClient } from "@/features/documents/DocumentListClient";

export default async function DokumenterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dokumentarkiv</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Policyer, prosedyrer og HMS-dokumenter
          </p>
        </div>
        {isHrAdmin && (
          <Button asChild className="min-h-[44px]">
            <Link href="/dokumenter/ny">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nytt dokument</span>
            </Link>
          </Button>
        )}
      </div>

      <DocumentListClient viewerRole={profile.role} />
    </div>
  );
}
