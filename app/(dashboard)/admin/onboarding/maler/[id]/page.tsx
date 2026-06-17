import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateEditForm } from "@/features/onboarding/TemplateEditForm";

export const metadata = { title: "Rediger mal – Admin" };

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) redirect("/ingen-tilgang");

  const [template, locations] = await Promise.all([
    db.onboardingTemplate.findUnique({
      where: { id: params.id },
      include: { tasks: { orderBy: { order: "asc" } }, location: { select: { id: true, name: true } } },
    }),
    db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!template) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/onboarding/maler">
            <ArrowLeft className="h-4 w-4 mr-1" /> Maler
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
            <Badge variant={template.type === "ONBOARDING" ? "default" : "secondary"}>
              {template.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
            </Badge>
          </div>
          {template.location && <p className="text-sm text-muted-foreground">{template.location.name}</p>}
        </div>
      </div>
      <TemplateEditForm template={template} locations={locations} />
    </div>
  );
}
