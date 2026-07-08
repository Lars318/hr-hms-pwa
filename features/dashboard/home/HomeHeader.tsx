"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Bell } from "lucide-react";

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function HomeHeader({ fullName, avatarUrl }: { fullName: string; avatarUrl: string | null }) {
  const [dateStr, setDateStr] = useState("");
  const [greeting, setGreeting] = useState("Hei");
  useEffect(() => {
    const now = new Date();
    setDateStr(format(now, "EEEE d. MMMM", { locale: nb }));
    const h = now.getHours();
    setGreeting(h < 10 ? "God morgen" : h < 17 ? "Hei" : "God kveld");
  }, []);

  const firstName = fullName.split(" ")[0];

  return (
    <div className="flex items-start justify-between pt-2">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{greeting}, {firstName}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/varsler" className="relative" aria-label="Varsler">
          <Bell className="h-[22px] w-[22px] text-muted-foreground" />
        </Link>
        <Link href="/profil">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {initials(fullName)}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
