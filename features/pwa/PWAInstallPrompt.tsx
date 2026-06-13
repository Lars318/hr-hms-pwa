"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

export function PWAInstallPrompt() {
  const { canInstall, prompt } = usePwaInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={prompt}
      className="gap-1.5 text-xs"
      title="Installer app"
    >
      <Download className="h-3.5 w-3.5" />
      Installer
    </Button>
  );
}
