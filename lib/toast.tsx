"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "./utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
  info: <Info className="h-4 w-4 text-primary shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />,
};

const styles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error = useCallback((m: string) => toast(m, "error"), [toast]);
  const info = useCallback((m: string) => toast(m, "info"), [toast]);
  const warning = useCallback((m: string) => toast(m, "warning"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}

      {/* Portal — bottom center på mobil, bottom-right på desktop */}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end lg:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm",
              "w-full max-w-sm",
              "animate-in slide-in-from-bottom-2 duration-200",
              styles[t.variant]
            )}
          >
            {icons[t.variant]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Lukk"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
