import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateCreateForm } from "@/features/onboarding/TemplateCreateForm";

export const metadata = { title: "Onboarding-maler – Admin" };

export default async function OnboardingMalerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "HR")) redirect("/ingen-tilgang");

  const [templates, locations] = await Promise.all([
    db.onboardingTemplate.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { tasks: true, processes: true } },
        location: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/onboarding">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding-maler</h1>
          <p className="text-sm text-muted-foreground">Administrer maler for onboarding og offboarding.</p>
        </div>
      </div>

      {/* Eksisterende maler */}
      {templates.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Aktive maler ({templates.length})</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {templates.map((t) => (
              <Link key={t.id} href={`/admin/onboarding/maler/${t.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t.name}</p>
                    <Badge variant={t.type === "ONBOARDING" ? "default" : "secondary"} className="text-xs">
                      {t.type === "ONBOARDING" ? "Onboarding" : "Offboarding"}
                    </Badge>
                  </div>
                  {t.location && <p className="text-xs text-muted-foreground">{t.location.name}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{t._count.tasks} oppgaver</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Opprett ny mal */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Opprett ny mal
        </h2>
        <TemplateCreateForm locations={locations} />
      </section>
    </div>
  );
}
