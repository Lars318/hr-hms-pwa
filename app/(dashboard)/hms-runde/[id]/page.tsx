import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { HmsRundeChecklist } from "@/features/hms-runde/HmsRundeChecklist";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const record = await db.inspectionRecord.findUnique({ where: { id: params.id } });
  return { title: record ? `${record.title} – Pulsfollo` : "HMS-runde – Pulsfollo" };
}

export default async function HmsRundeDetaljPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!viewer) redirect("/login");

  const record = await db.inspectionRecord.findUnique({
    where: { id: params.id },
    include: {
      template: { include: { items: { orderBy: { order: "asc" } } } },
      location: { select: { id: true, name: true } },
      performedBy: { select: { id: true, fullName: true } },
      responses: true,
    },
  });

  if (!record) notFound();

  const isHrAdmin = viewer.role === "ADMIN" || viewer.role === "HR";
  if (!isHrAdmin && record.performedById !== viewer.id) redirect("/ingen-tilgang");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/hms-runde">
          <ArrowLeft className="h-4 w-4 mr-1" /> HMS-runde
        </Link>
      </Button>

      <HmsRundeChecklist
        record={{
          id: record.id,
          title: record.title,
          status: record.status,
          notes: record.notes,
          completedAt: record.completedAt?.toISOString() ?? null,
          location: record.location,
          performedBy: record.performedBy,
          template: {
            title: record.template.title,
            items: record.template.items.map((item) => ({
              id: item.id,
              question: item.question,
              description: item.description,
              required: item.required,
            })),
          },
          responses: record.responses.map((r) => ({
            itemId: r.itemId,
            answer: r.answer,
            comment: r.comment,
          })),
        }}
        canEdit={record.status === "IN_PROGRESS" && (isHrAdmin || record.performedById === viewer.id)}
      />
    </div>
  );
}
