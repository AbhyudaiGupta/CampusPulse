"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ResetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40">
        <motion.div
          className="card max-w-[460px] w-full p-6 bg-white border border-[var(--color-border-subtle)] rounded-[6px] relative"
          role="dialog"
          aria-labelledby="reset-modal-title"
          aria-describedby="reset-modal-desc"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon absolute right-4 top-4 text-[var(--color-text-muted)]"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {/* Icon Header */}
          <div className="w-12 h-12 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>

          <h3 id="reset-modal-title" className="text-[18px] font-bold text-[var(--color-text-primary)] mb-2">
            Confirm Campus Baseline Reset?
          </h3>

          <p id="reset-modal-desc" className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
            This action will immediately override all current live space occupancies across Central Library, Computer Labs, Main Canteen, and Study Rooms back to default baseline values. Any simulated surges will be halted.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary text-[13px] py-2 px-4 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="btn text-[13px] py-2 px-4 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-[8px] flex items-center gap-1.5"
            >
              <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Resetting..." : "Reset All Spaces"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
