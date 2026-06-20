"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut, ChevronRight, Briefcase, Bell, Shield,
  MapPin, Building2, Tag, Phone, Mail, Pencil, Check, X,
  Sun, Moon, Monitor, Loader2,
} from "lucide-react";
import { AvatarUpload } from "@/features/profile/AvatarUpload";
import { PasskeySetup } from "@/features/auth/PasskeySetup";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  HR: "HR",
  MANAGER: "Leder",
  EMPLOYEE: "Ansatt",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-destructive/15 text-destructive",
  HR: "bg-accent/20 text-accent-foreground",
  MANAGER: "bg-primary/15 text-primary",
  EMPLOYEE: "bg-muted text-muted-foreground",
};


function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ThemeRow() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { value: "light", icon: Sun, label: "Lys" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Mørk" },
  ] as const;

  return (
    <div className="flex items-center rounded-xl border bg-muted p-0.5 gap-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex items-center justify-center rounded-lg h-7 w-7 transition-colors",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

interface MenuSection {
  title: string;
  items: { icon: React.ElementType; label: string; href?: string; value?: string }[];
}

export function MyProfileClient({ email }: { email: string }) {
  const { data: profile, isLoading } = trpc.profile.me.useQuery();
  const utils = trpc.useUtils();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setTitle(profile.title ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const update = trpc.profile.update.useMutation({
    onSuccess() {
      utils.profile.me.invalidate();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dirty =
    fullName !== profile.fullName ||
    title !== (profile.title ?? "") ||
    phone !== (profile.phone ?? "");

  const location =
    (profile as any).profileAssignments?.[0]?.location?.name ?? null;
  const department = (profile as any).department?.name ?? null;

  const menuSections: MenuSection[] = [
    {
      title: "Jobb",
      items: [
        { icon: Briefcase, label: "Stilling", value: profile.title ?? "—" },
        { icon: Building2, label: "Avdeling", value: department ?? "—" },
        { icon: MapPin, label: "Lokasjon", value: location ?? "—" },
        { icon: Tag, label: "Rolle", value: ROLE_LABEL[profile.role] ?? profile.role },
      ],
    },
    {
      title: "Kontakt",
      items: [
        { icon: Mail, label: "E-post", value: email },
        { icon: Phone, label: "Telefon", value: profile.phone ?? "—" },
      ],
    },
    {
      title: "Innstillinger",
      items: [
        { icon: Bell, label: "Varsler" },
        { icon: Shield, label: "Personvern" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-0 -mt-6 -mx-4 lg:-mx-8">
      {/* ── Hero ── */}
      <div className="relative h-56 lg:h-64 overflow-hidden bg-primary/20">
        {/* Background: person image if no avatar, else avatar blurred */}
        <img
          src={
            profile.avatarUrl
              ? profile.avatarUrl
              : `https://api.dicebear.com/8.x/personas/svg?seed=${encodeURIComponent(profile.fullName)}&backgroundColor=b5d4b0,c8a090,a0b8c8`
          }
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background/80" />

        {/* Edit button */}
        <button
          onClick={() => setEditing((v) => !v)}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Rediger
        </button>

        {/* Avatar med opplasting */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="ring-4 ring-background rounded-full shadow-xl">
            <AvatarUpload
              profileId={profile.id}
              currentUrl={profile.avatarUrl ?? null}
              fullName={profile.fullName}
            />
          </div>
        </div>
      </div>

      {/* ── Name block ── */}
      <div className="pt-16 pb-6 px-4 text-center">
        {editing ? (
          <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Fullt navn"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-center text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Stilling / tittel"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-center text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="+47 000 00 000"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  if (!dirty || update.isPending) return;
                  update.mutate({
                    fullName: fullName.trim(),
                    title: title.trim() || null,
                    phone: phone.trim() || null,
                  });
                }}
                disabled={!dirty || update.isPending}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  dirty && !update.isPending
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {update.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Lagre
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  if (profile) {
                    setFullName(profile.fullName);
                    setTitle(profile.title ?? "");
                    setPhone(profile.phone ?? "");
                  }
                }}
                className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="h-3 w-3" />
                Avbryt
              </button>
            </div>
            {saved && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Check className="h-3 w-3" /> Lagret
              </p>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
            {profile.title && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.title}</p>
            )}
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              {location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
              {department && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {department}
                </span>
              )}
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ROLE_COLOR[profile.role] ?? "bg-muted text-muted-foreground")}>
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>

            {/* Contact pills */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Ring meg
                </a>
              )}
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Send e-post
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Menu sections ── */}
      <div className="px-4 pb-8 flex flex-col gap-3">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 px-1">
              {section.title}
            </p>
            <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
              {section.items.map(({ icon: Icon, label, value, href }) => (
                <div
                  key={label}
                  onClick={() => href && router.push(href)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5",
                    href && "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  {value ? (
                    <span className="text-sm text-muted-foreground truncate max-w-[160px]">{value}</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Passkey / Face ID */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 px-1">
            Sikkerhet
          </p>
          <div className="rounded-2xl border bg-card px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">Face ID / Passkey</span>
            </div>
            <PasskeySetup hasPasskey={false} />
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 px-1">
            Utseende
          </p>
          <div className="rounded-2xl border bg-card px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">Visningsmodus</span>
            </div>
            <ThemeRow />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-card px-4 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          Logg ut
        </button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Rolle og e-post kan kun endres av administrator.
        </p>
      </div>
    </div>
  );
}
