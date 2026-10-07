"use client";
import { motion, AnimatePresence } from "framer-motion";
import { createContext, useContext, useState, useCallback, useId } from "react";
import type { ToastMessage } from "@/lib/types";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (msg: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Toast Icons ───────────────────────────────────────────────────────────────

const ICONS = {
  success: <CheckCircle className="text-emerald-500 shrink-0" size={18} />,
  error: <XCircle className="text-red-500 shrink-0" size={18} />,
  warning: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
  info: <Info className="text-cyan-500 shrink-0" size={18} />,
};

const BORDER_COLORS: Record<ToastMessage["variant"], string> = {
  success: "border-l-emerald-400",
  error: "border-l-red-400",
  warning: "border-l-amber-400",
  info: "border-l-cyan-400",
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const uid = useId();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (msg: Omit<ToastMessage, "id">) => {
      const id = `${uid}-${Date.now()}`;
      const toast: ToastMessage = { ...msg, id, duration: msg.duration ?? 4500 };
      setToasts((prev) => [...prev.slice(-4), toast]);
      setTimeout(() => removeToast(id), toast.duration);
    },
    [uid, removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-root" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={cn("toast border-l-4", BORDER_COLORS[t.variant])}
              role="alert"
            >
              {ICONS[t.variant]}
              <div className="flex-1 min-w-0">
                <p className="toast-title">{t.title}</p>
                {t.body && <p className="toast-body">{t.body}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="btn-ghost btn-icon shrink-0 opacity-50 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
