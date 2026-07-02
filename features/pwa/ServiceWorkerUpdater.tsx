"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Oppdager når en ny service worker (= ny app-versjon) er klar, og laster
 * siden på nytt slik at brukeren får siste kode uten å logge ut/inn.
 *
 * Nøkkelen er å sjekke etter oppdatering OFTE:
 *  - ved hver side-navigasjon i appen (usePathname)
 *  - hvert 2. minutt
 *  - når appen får fokus igjen
 * Når en ny SW aktiveres (skipWaiting er på) fyrer `controllerchange`, og vi
 * laster automatisk én gang. En stripe vises også som fallback/varsel.
 */
export function ServiceWorkerUpdater() {
  const [updateReady, setUpdateReady] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      regRef.current = reg;

      const trackInstalling = (worker: ServiceWorker | null) => {
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) setUpdateReady(true);
      trackInstalling(reg.installing);
      reg.addEventListener("updatefound", () => trackInstalling(reg.installing));
      reg.update().catch(() => {});
    });

    const check = () => regRef.current?.update().catch(() => {});
    const interval = setInterval(check, 2 * 60 * 1000); // hvert 2. minutt
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  // Sjekk etter ny versjon ved hver navigasjon i appen.
  useEffect(() => {
    regRef.current?.update().catch(() => {});
  }, [pathname]);

  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    });
  }

  if (!updateReady) return null;

  return (
    <button
      onClick={applyUpdate}
      className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg lg:bottom-4 lg:inset-x-auto lg:right-4 lg:rounded-full"
      role="status"
    >
      <RefreshCw className="h-4 w-4" />
      Ny versjon tilgjengelig — trykk for å oppdatere
    </button>
  );
}
