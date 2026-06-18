import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { StartRundeForm } from "@/features/hms-runde/StartRundeForm";

export const metadata = { title: "Start HMS-runde – Pulsfollo" };

export default async function NyHmsRundePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [templates, locations] = await Promise.all([
    db.inspectionTemplate.findMany({
      where: { isActive: true },
      orderBy: { title: "asc" },
    }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/hms-runde">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
        </Link>
      </Button>
      <h1 className="text-xl font-bold">Start HMS-runde</h1>
      <StartRundeForm
        templates={templates.map((t) => ({ id: t.id, title: t.title }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}
