"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  HR: "HR",
  MANAGER: "Leder",
  EMPLOYEE: "Ansatt",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function MyProfileClient({ email }: { email: string }) {
  const { data: profile, isLoading } = trpc.profile.me.useQuery();
  const utils = trpc.useUtils();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

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
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading || !profile) {
    return <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />;
  }

  const dirty =
    fullName !== profile.fullName ||
    title !== (profile.title ?? "") ||
    phone !== (profile.phone ?? "");

  return (
    <div className="space-y-6">
      {/* Avatar + basisinfo */}
      <div className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-5">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0 select-none">
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt={profile.fullName} className="h-16 w-16 rounded-full object-cover" />
            : initials(profile.fullName)
          }
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{profile.fullName}</p>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
          <span className="mt-1 inline-block rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
            {ROLE_LABEL[profile.role] ?? profile.role}
          </span>
        </div>
      </div>

      {/* Redigeringsskjema */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty || update.isPending) return;
          update.mutate({
            fullName: fullName.trim(),
            title: title.trim() || null,
            phone: phone.trim() || null,
          });
        }}
        className="rounded-2xl border bg-card px-5 py-5 space-y-4"
      >
        <p className="text-sm font-semibold">Rediger kontaktinfo</p>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="fullName">Fullt navn</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="title">Stilling / tittel</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks. Personlig trener"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="phone">Telefon</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+47 000 00 000"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!dirty || update.isPending}
            className={cn(
              "h-10 rounded-xl px-5 text-sm font-medium transition-colors",
              dirty && !update.isPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {update.isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Lagrer…</span>
            ) : "Lagre endringer"}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Lagret
            </span>
          )}

          {update.isError && (
            <span className="text-sm text-destructive">Noe gikk galt. Prøv igjen.</span>
          )}
        </div>
      </form>

      <p className="text-xs text-muted-foreground px-1">
        Rolle og e-post kan kun endres av administrator.
      </p>

      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-2xl border border-destructive/30 px-5 py-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Logg ut
      </button>
    </div>
  );
}
