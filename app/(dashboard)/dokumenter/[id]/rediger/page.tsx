import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { DocumentForm } from "@/features/documents/DocumentForm";

interface Props {
  params: { id: string };
}

export default async function RedigerDokumentPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");
  if (profile.role !== "ADMIN" && profile.role !== "HR") redirect("/dokumenter");

  const doc = await db.document.findUnique({ where: { id: params.id } });
  if (!doc) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-sm text-muted-foreground mb-1">
          <Link href="/dokumenter" className="hover:underline">Dokumentarkiv</Link>
          {" / "}
          <Link href={`/dokumenter/${doc.id}`} className="hover:underline">{doc.title}</Link>
          {" / "}
          <span>Rediger</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Rediger dokument</h1>
      </div>

      <DocumentForm mode="edit" document={doc} />
    </div>
  );
}
