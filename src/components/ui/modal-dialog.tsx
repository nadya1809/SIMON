"use client";

import { ReactNode, useEffect } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";

type ModalDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function ModalDialog({
  open,
  title,
  description,
  children,
  onClose,
  className
}: ModalDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[rgba(19,39,56,0.38)] px-4 py-8 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative max-h-[calc(100vh-4rem)] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,250,253,0.98))] shadow-[0_32px_80px_rgba(24,50,71,0.18)]",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-6 py-5 backdrop-blur">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-[-0.01em]">{title}</h3>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-white text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
