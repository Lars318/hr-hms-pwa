import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const profile = await db.profile.findUnique({ where: { id: params.id } });
  return { title: profile ? `${profile.fullName} – HR/HMS` : "Ansatt – HR/HMS" };
}

export default async function AnsattDetaljPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const viewer = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  const isHrAdmin = viewer?.role === "ADMIN" || viewer?.role === "HR";

  const profile = await db.profile.findUnique({
    where: { id: params.id },
    include: { department: true, manager: { select: { id: true, fullName: true } } },
  });

  if (!profile) notFound();

  // Vanlige ansatte kan kun se sin egen profil
  if (!isHrAdmin && viewer?.id !== profile.id) redirect("/ingen-tilgang");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ansatte">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
          </Link>
        </Button>
        {isHrAdmin && (
          <Button asChild size="sm">
            <Link href={`/ansatte/${profile.id}/rediger`}>
              <Pencil className="h-4 w-4 mr-1" /> Rediger
            </Link>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
        {profile.title && <p className="text-muted-foreground">{profile.title}</p>}
        <div className="flex gap-2 mt-2">
          <RoleBadge role={profile.role} />
          <StatusBadge status={profile.status} />
        </div>
      </div>

      <Separator />

      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">E-post</dt>
          <dd className="font-medium mt-0.5">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Telefon</dt>
          <dd className="font-medium mt-0.5">{profile.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Avdeling</dt>
          <dd className="font-medium mt-0.5">{profile.department?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Nærmeste leder</dt>
          <dd className="font-medium mt-0.5">{profile.manager?.fullName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ansatt dato</dt>
          <dd className="font-medium mt-0.5">
            {format(new Date(profile.employedAt), "d. MMMM yyyy", { locale: nb })}
          </dd>
        </div>
        {profile.terminatedAt && (
          <div>
            <dt className="text-muted-foreground">Sluttdato</dt>
            <dd className="font-medium mt-0.5">
              {format(new Date(profile.terminatedAt), "d. MMMM yyyy", { locale: nb })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
