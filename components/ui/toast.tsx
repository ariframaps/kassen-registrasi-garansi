"use client";
// components/ui/toast.tsx
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; type: ToastType; title: string; description?: string; }
interface Ctx { toast: (o: Omit<Toast, "id">) => void; success: (t: string, d?: string) => void; error: (t: string, d?: string) => void; warning: (t: string, d?: string) => void; }

const ToastCtx = createContext<Ctx | null>(null);

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: AlertTriangle };
const styles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white text-zinc-900",
  error:   "border-red-200 bg-white text-zinc-900",
  warning: "border-amber-200 bg-white text-zinc-900",
  info:    "border-blue-200 bg-white text-zinc-900",
};
const iconStyles: Record<ToastType, string> = {
  success: "text-emerald-500",
  error:   "text-red-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  const toast = useCallback((o: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { ...o, id }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((title: string, description?: string) => toast({ type: "success", title, description }), [toast]);
  const error   = useCallback((title: string, description?: string) => toast({ type: "error", title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: "warning", title, description }), [toast]);

  return (
    <ToastCtx.Provider value={{ toast, success, error, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-up pointer-events-auto ${styles[t.type]}`}>
              <Icon size={15} className={`shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return ctx;
}
