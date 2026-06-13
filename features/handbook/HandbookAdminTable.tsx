"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ListCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, ChevronRight, Pencil, Trash2 } from "lucide-react";

export function HandbookAdminTable() {
  const utils = trpc.useUtils();
  const { success, error: toastError } = useToast();
  const { data: categories = [], isLoading } = trpc.handbook.listCategories.useQuery();

  const del = trpc.handbook.deleteCategory.useMutation({
    onSuccess: () => {
      utils.handbook.listCategories.invalidate();
      success("Kapittel slettet.");
    },
    onError: (err) => toastError(err.message),
  });

  if (isLoading) return <ListCardSkeleton count={4} />;
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Ingen kapitler ennå"
        description="Opprett det første kapittelet for å komme i gang."
      />
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{cat.title}</p>
            <p className="text-xs text-muted-foreground">
              {cat.sections.length} seksjon{cat.sections.length !== 1 ? "er" : ""} · rekkefølge: {cat.order}
            </p>
            {cat.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
              <Link href={`/personalhandbok/admin/${cat.id}/rediger`} aria-label="Rediger">
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => del.mutate({ id: cat.id })}
              disabled={del.isPending}
              aria-label="Slett"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
              <Link href={`/personalhandbok/${cat.id}`} aria-label="Vis">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
