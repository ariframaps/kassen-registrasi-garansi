"use client";
// components/ui/modal.tsx
import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl border border-zinc-200 animate-scale-in`}>
        {(title || description) && (
          <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
            <div>
              {title && <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>}
              {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button onClick={onClose} className="ml-4 p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
              <X size={15} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description, confirmLabel = "Konfirmasi", variant = "primary", loading
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmLabel?: string;
  variant?: "danger" | "primary"; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-zinc-600 mb-5">{description}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
