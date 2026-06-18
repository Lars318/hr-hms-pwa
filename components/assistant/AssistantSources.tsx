"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Source {
  title: string;
  content: string;
}

interface AssistantSourcesProps {
  sources: Source[];
}

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
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="rounded-lg border bg-background p-3 text-xs">
              <p className="font-semibold mb-1">{s.title}</p>
              <p className="text-muted-foreground line-clamp-3">{s.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
