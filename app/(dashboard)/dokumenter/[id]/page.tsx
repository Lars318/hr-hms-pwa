import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DocumentDetail } from "@/features/documents/DocumentDetail";

interface Props {
  params: { id: string };
}

export default async function DokumentDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const doc = await db.document.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, fullName: true } },
    },
  });

  if (!doc) notFound();

  // Access check: PRIVATE only for ADMIN/HR
  if (doc.visibility === "PRIVATE" && profile.role !== "ADMIN" && profile.role !== "HR") {
    redirect("/dokumenter");
  }

  const myConfirmation = await db.documentReadConfirmation.findFirst({
    where: {
      documentId: doc.id,
      profileId: profile.id,
      documentVersion: doc.version,
    },
  });

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";
  const isConfirmedByMe = !!myConfirmation;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            <Link href="/dokumenter" className="hover:underline">Dokumentarkiv</Link>
            {" / "}
            <span>{doc.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
        </div>
        {isHrAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dokumenter/${doc.id}/rediger`}>
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Link>
          </Button>
        )}
      </div>

      <DocumentDetail
        document={{ ...doc, isConfirmedByMe, readStats: null }}
        viewerRole={profile.role}
      />
    </div>
  );
}
