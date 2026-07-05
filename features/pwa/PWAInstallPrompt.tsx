"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

type Platform = "chromium" | "safari-mac" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIOS) return "ios";
  const isSafari = /^((?!chrome|android|crios|edg|fxios).)*safari/i.test(ua);
  if (isSafari) return "safari-mac";
  return "chromium";
}

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, prompt } = usePwaInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  // Allerede installert → ingen knapp.
  if (isInstalled) return null;

  const platform = detectPlatform();

  async function handleClick() {
    if (canInstall) {
      await prompt();
    } else {
      // Ingen native prompt (Safari/iOS, eller kriterier ikke møtt) → vis hjelp.
      setShowHelp(true);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick} className="gap-1.5 text-xs" title="Installer app">
        <Download className="h-3.5 w-3.5" />
        Installer
      </Button>

      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">Installer Truls HR</h2>
              <button onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground" aria-label="Lukk">
                <X className="h-4 w-4" />
              </button>
            </div>

            {platform === "safari-mac" && (
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
                <li>Trykk på <strong>Del</strong>-knappen i Safari (eller menyen <strong>Fil</strong>).</li>
                <li>Velg <strong>«Legg til i Dock…»</strong>.</li>
                <li>Bekreft — appen legges i Dock og åpnes i eget vindu.</li>
              </ol>
            )}

            {platform === "ios" && (
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
                <li>Trykk på <strong>Del</strong>-knappen nederst i Safari.</li>
                <li>Velg <strong>«Legg til på Hjem-skjerm»</strong>.</li>
                <li>Trykk <strong>Legg til</strong>.</li>
              </ol>
            )}

            {(platform === "chromium" || platform === "other") && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Se etter <strong>installer-ikonet</strong> (⊕ / skjerm-ikon) helt til høyre i adressefeltet, og trykk <strong>Installer</strong>.</p>
                <p className="text-xs">Finner du det ikke: åpne nettlesermenyen (⋮) → «Installer Truls HR…» / «Legg til på …».</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground border-t pt-2">
              Bruk gjerne <strong>Chrome</strong> eller <strong>Edge</strong> for enklest installasjon på Mac/PC.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
