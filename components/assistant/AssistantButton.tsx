"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { AssistantWidget } from "./AssistantWidget";

export function AssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-[60] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all md:bottom-6"
          aria-label="Åpne Truls"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Widget panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-[59] bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div className="fixed z-[60] inset-x-0 bottom-0 top-16 md:inset-auto md:bottom-6 md:right-4 md:w-[400px] md:h-[600px] md:top-auto rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden border bg-background">
            <AssistantWidget onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
