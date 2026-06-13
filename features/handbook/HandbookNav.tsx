"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { HandbookCategory } from "@prisma/client";
import { BookOpen } from "lucide-react";

interface Props {
  categories: (HandbookCategory & { sections: { id: string }[] })[];
}

export function HandbookNav({ categories }: Props) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/personalhandbok"
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/personalhandbok"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        Oversikt
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/personalhandbok/${cat.id}`}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === `/personalhandbok/${cat.id}`
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <span className="w-4 text-center text-xs font-mono text-muted-foreground shrink-0">
            {cat.sections.length}
          </span>
          <span className="truncate">{cat.title}</span>
        </Link>
      ))}
    </nav>
  );
}
