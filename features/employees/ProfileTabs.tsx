"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Mail, Phone, Building2, UserCheck, Calendar, GraduationCap, FileText, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AvatarUpload } from "@/features/profile/AvatarUpload";
import { EmploymentHistory } from "./EmploymentHistory";
import { AssignmentManager } from "./AssignmentManager";
import type { Role, ProfileStatus } from "@prisma/client";

interface Course {
  id: string;
  title: string;
  completedAt: Date | null;
  expiresAt: Date | null;
}

interface Document {
  id: string;
  title: string;
  category: string;
  version: number;
  confirmed: boolean;
}

interface Assignment {
  id: string;
  isPrimary: boolean;
  roleLabel: string | null;
  location: { id: string; name: string; city: string | null };
  department: { id: string; name: string } | null;
}

interface ProfileTabsProps {
  profileId: string;
  fullName: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  role: Role;
  status: ProfileStatus;
  department: { name: string } | null;
  manager: { id: string; fullName: string; email: string } | null;
  employedAt: Date;
  terminatedAt: Date | null;
  courses: Course[];
  documents: Document[];
  assignments: Assignment[];
  canEdit: boolean;
  editHref: string;
}

type Tab = "oversikt" | "kompetanse" | "dokumenter" | "lonn";

const TABS: { id: Tab; label: string; hrOnly?: boolean }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "kompetanse", label: "Kompetanse" },
  { id: "dokumenter", label: "Dokumenter" },
  { id: "lonn", label: "Lønn & stilling", hrOnly: true },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return <span className="text-3xl font-bold select-none">{init.toUpperCase()}</span>;
}

export function ProfileTabs({
  profileId, fullName, email, phone, title, avatarUrl, role, status,
  department, manager, employedAt, terminatedAt, courses, documents, assignments,
  canEdit, editHref,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<Tab>("oversikt");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-4">
          {canEdit ? (
            <AvatarUpload profileId={profileId} currentUrl={avatarUrl} fullName={fullName} />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                : <Initials name={fullName} />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{fullName}</h1>
            {title && <p className="text-sm text-muted-foreground">{title}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <RoleBadge role={role} />
              <StatusBadge status={status} />
            </div>
          </div>
          {canEdit && (
            <Link
              href={editHref}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors"
            >
              Rediger
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border bg-muted/30 p-1 gap-1">
        {TABS.filter((t) => !t.hrOnly || canEdit).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Oversikt */}
      {tab === "oversikt" && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <InfoRow icon={Mail} label={email} />
          {phone && <InfoRow icon={Phone} label={phone} />}
          {department && <InfoRow icon={Building2} label={department.name} />}
          {manager && (
            <InfoRow
              icon={UserCheck}
              label={
                <a
                  href={`mailto:${manager.email}`}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {manager.fullName}
                </a>
              }
              sublabel="Nærmeste leder"
            />
          )}
          <InfoRow
            icon={Calendar}
            label={`Ansatt ${format(new Date(employedAt), "d. MMMM yyyy", { locale: nb })}`}
          />
          {terminatedAt && (
            <InfoRow
              icon={Calendar}
              label={`Sluttet ${format(new Date(terminatedAt), "d. MMMM yyyy", { locale: nb })}`}
            />
          )}
          {assignments.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lokasjoner</p>
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {a.location.name}{a.location.city ? `, ${a.location.city}` : ""}
                      {a.isPrimary && <span className="ml-2 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">Primær</span>}
                    </p>
                    {(a.department || a.roleLabel) && (
                      <p className="text-xs text-muted-foreground">
                        {[a.department?.name, a.roleLabel].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kompetanse */}
      {tab === "kompetanse" && (
        <div className="rounded-2xl border bg-card divide-y divide-border">
          {courses.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Ingen kurs registrert.</p>
          ) : courses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                {c.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Fullført {format(new Date(c.completedAt), "d. MMM yyyy", { locale: nb })}
                    {c.expiresAt && ` · Utløper ${format(new Date(c.expiresAt), "d. MMM yyyy", { locale: nb })}`}
                  </p>
                )}
              </div>
              {c.completedAt && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Lønn & stilling */}
      {tab === "lonn" && canEdit && (
        <div className="space-y-6">
          <EmploymentHistory profileId={profileId} />
          <div className="rounded-2xl border bg-card p-5">
            <AssignmentManager profileId={profileId} />
          </div>
        </div>
      )}

      {/* Dokumenter */}
      {tab === "dokumenter" && (
        <div className="rounded-2xl border bg-card divide-y divide-border">
          {documents.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Ingen dokumenter tilgjengelig.</p>
          ) : documents.map((d) => (
            <Link key={d.id} href={`/dokumenter/${d.id}`} className="flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.category} · v{d.version}</p>
              </div>
              {d.confirmed && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, sublabel }: { icon: React.ElementType; label: React.ReactNode; sublabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        {sublabel && <p className="text-xs text-muted-foreground leading-none mb-0.5">{sublabel}</p>}
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
