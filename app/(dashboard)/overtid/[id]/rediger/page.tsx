import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { OvertimeForm } from "@/features/overtime/OvertimeForm";

export const metadata = { title: "Rediger overtidsregistrering – HR/HMS" };

export default async function RedigerOvertidPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const entry = await db.overtimeEntry.findUnique({ where: { id: params.id } });
  if (!entry) notFound();
  if (entry.employeeId !== profile.id) redirect("/ingen-tilgang");
  if (!["DRAFT", "REJECTED"].includes(entry.status)) redirect(`/overtid/${params.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/overtid/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Rediger registrering</h1>
      </div>
      <OvertimeForm
        mode="edit"
        existing={{
          id: entry.id,
          date: entry.date,
          hours: entry.hours,
          type: entry.type,
          description: entry.description,
        }}
      />
    </div>
  );
}
