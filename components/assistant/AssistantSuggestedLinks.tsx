"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SuggestedLink {
  label: string;
  href: string;
}

interface AssistantSuggestedLinksProps {
  links: SuggestedLink[];
}

export function AssistantSuggestedLinks({ links }: AssistantSuggestedLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Snarveier
      </p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <span className="truncate">{l.label}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}
