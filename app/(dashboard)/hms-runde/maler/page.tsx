import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { TemplateAdmin } from "@/features/hms-runde/TemplateAdmin";

export const metadata = { title: "HMS-maler – Truls HR" };

export default async function HmsMalerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "HR")) redirect("/ingen-tilgang");

  const templates = await db.inspectionTemplate.findMany({
    include: { items: { orderBy: { order: "asc" } }, _count: { select: { records: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/hms-runde">
          <ArrowLeft className="h-4 w-4 mr-1" /> HMS-runde
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">Sjekkliste-maler</h1>
      <TemplateAdmin
        templates={templates.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          isActive: t.isActive,
          recordCount: t._count.records,
          items: t.items.map((i) => ({
            id: i.id,
            question: i.question,
            description: i.description,
            order: i.order,
            required: i.required,
          })),
        }))}
      />
    </div>
  );
}
