"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

function PersonCard({
  fullName,
  title,
  email,
  phone,
  avatarUrl,
  role,
}: {
  fullName: string;
  title: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
}) {
  const dicebearUrl = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=b5d4b0`;
  const href = phone ? `tel:${phone}` : `mailto:${email}`;

  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors text-center no-underline"
    >
      <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
        <img
          src={avatarUrl ?? dicebearUrl}
          alt={fullName}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <p className="text-xs font-medium leading-tight">{fullName}</p>
        <p className="text-xs text-muted-foreground leading-tight">{title ?? "—"}</p>
      </div>
      {role === "MANAGER" && (
        <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
          Leder
        </span>
      )}
    </a>
  );
}

export function DirectoryClient() {
  const [view, setView] = useState<"liste" | "team">("liste");
  const [search, setSearch] = useState("");

  const { data: departments = [], isLoading: deptLoading } =
    trpc.profile.byDepartment.useQuery(undefined, { enabled: view === "team" });

  const { data: allProfiles = [], isLoading: listLoading } =
    trpc.profile.byDepartment.useQuery(undefined, { enabled: view === "liste" });

  // For liste-view: flatten all members and filter by search
  const flatProfiles = allProfiles.flatMap((d) => d.members);
  const filtered = search
    ? flatProfiles.filter(
        (p) =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (p.title ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : flatProfiles;

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("liste")}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            view === "liste"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:bg-muted border-border"
          }`}
        >
          Liste
        </button>
        <button
          onClick={() => setView("team")}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            view === "team"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:bg-muted border-border"
          }`}
        >
          Team
        </button>
      </div>

      {/* Liste-visning */}
      {view === "liste" && (
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Søk etter navn eller stilling…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-card px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {listLoading ? (
            <div className="text-sm text-muted-foreground">Laster…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-2xl border bg-card overflow-hidden">
                  <PersonCard
                    fullName={p.fullName}
                    title={p.title}
                    email={p.email}
                    phone={p.phone}
                    avatarUrl={p.avatarUrl}
                    role={p.role}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{filtered.length} ansatte</p>
        </div>
      )}

      {/* Team-visning */}
      {view === "team" && (
        <div className="space-y-4">
          {deptLoading ? (
            <div className="text-sm text-muted-foreground">Laster…</div>
          ) : (
            departments.map((dept) => {
              const sorted = [...dept.members].sort((a, b) => {
                if (a.role === "MANAGER" && b.role !== "MANAGER") return -1;
                if (b.role === "MANAGER" && a.role !== "MANAGER") return 1;
                return a.fullName.localeCompare(b.fullName, "nb");
              });
              return (
                <div key={dept.deptId} className="rounded-2xl border bg-card overflow-hidden">
                  <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{dept.deptName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {dept.members.length} ansatte
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sorted.map((p) => (
                      <PersonCard
                        key={p.id}
                        fullName={p.fullName}
                        title={p.title}
                        email={p.email}
                        phone={p.phone}
                        avatarUrl={p.avatarUrl}
                        role={p.role}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
