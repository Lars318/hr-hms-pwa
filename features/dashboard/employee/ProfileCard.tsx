import { Mail, Phone, Building2, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface ProfileCardProps {
  fullName: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  department: { name: string } | null;
  employedAt: Date;
  role: string;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0].slice(0, 2);
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold select-none">
      {initials.toUpperCase()}
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Ansatt",
  MANAGER: "Leder",
  HR: "HR",
  ADMIN: "Administrator",
};

export function ProfileCard({
  fullName, email, phone, title, avatarUrl,
  department, employedAt, role,
}: ProfileCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      {/* Avatar + navn */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <Initials name={fullName} />
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{fullName}</h1>
          {title && (
            <p className="text-sm text-muted-foreground truncate">{title}</p>
          )}
          <span className="inline-flex items-center mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
      </div>

      {/* Detaljer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{email}</span>
        </div>

        {phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{phone}</span>
          </div>
        )}

        {department && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{department.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Ansatt {format(new Date(employedAt), "d. MMMM yyyy", { locale: nb })}</span>
        </div>
      </div>
    </div>
  );
}
