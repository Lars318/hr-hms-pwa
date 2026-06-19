"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const DEFAULT_PALETTE = "sage";
const PALETTE_KEY = "app-palette";

function PaletteApplier() {
  useEffect(() => {
    const palette = localStorage.getItem(PALETTE_KEY) ?? DEFAULT_PALETTE;
    document.documentElement.dataset.palette = palette;
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <PaletteApplier />
      {children}
    </NextThemesProvider>
  );
}
