"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function ChemicalArchiveButton({ id }: { id: string }) {
  const router = useRouter();
  const archive = trpc.chemical.archive.useMutation({
    onSuccess: () => router.push("/kjemikalier"),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={archive.isPending}
      onClick={() => { if (confirm("Arkiver dette kjemikaliet?")) archive.mutate({ id }); }}
    >
      {archive.isPending ? "Arkiverer..." : "Arkiver"}
    </Button>
  );
}
