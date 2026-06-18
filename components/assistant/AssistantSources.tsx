"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Source {
  title: string;
  href?: string;
  type: "route" | "static" | "handbook" | "document";
}

interface AssistantSourcesProps {
  sources: Source[];
}

const TYPE_LABEL: Record<Source["type"], string> = {
  route: "Side",
  static: "Intern info",
  handbook: "Håndbok",
  document: "Dokument",
};

export function AssistantSources({ sources }: AssistantSourcesProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <BookOpen className="h-3 w-3" />
        {sources.length} kilde{sources.length > 1 ? "r" : ""}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) =>
            s.href ? (
              <Link
                key={i}
                href={s.href}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground ml-2 shrink-0">{TYPE_LABEL[s.type]}</span>
              </Link>
            ) : (
              <div key={i} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs">
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground ml-2 shrink-0">{TYPE_LABEL[s.type]}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
