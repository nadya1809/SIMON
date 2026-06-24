"use client";

import { useEffect } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCheck,
  faFloppyDisk,
  faTrashCan,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "primary" | "success" | "warning";
  icon?: IconDefinition;
  onConfirm: () => void;
  onClose: () => void;
};

const dialogToneMap = {
  danger: {
    badge: "text-[var(--danger-fg)]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(252,236,235,0.98),rgba(255,244,223,0.96))] text-[var(--danger-fg)]",
    confirmVariant: "danger" as const,
    defaultIcon: faTrashCan
  },
  primary: {
    badge: "text-[var(--accent-strong)]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(234,244,251,0.98),rgba(222,239,250,0.96))] text-[var(--accent-strong)]",
    confirmVariant: "primary" as const,
    defaultIcon: faFloppyDisk
  },
  success: {
    badge: "text-[#117b5c]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(229,248,241,0.98),rgba(238,251,245,0.96))] text-[#117b5c]",
    confirmVariant: "primary" as const,
    defaultIcon: faCheck
  },
  warning: {
    badge: "text-[#9a5b00]",
    iconWrap:
      "bg-[linear-gradient(135deg,rgba(255,245,221,0.98),rgba(255,250,236,0.96))] text-[#9a5b00]",
    confirmVariant: "primary" as const,
    defaultIcon: faWandSparkles
  }
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, hapus",
  cancelLabel = "Batal",
  isLoading = false,
  variant = "danger",
  icon,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  const tone = dialogToneMap[variant];
  const dialogIcon = icon ?? tone.defaultIcon;
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isLoading, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(19,39,56,0.42)] px-4 py-8 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Tutup dialog konfirmasi"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isLoading) {
            onClose();
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,250,253,0.98))] p-6 shadow-[0_30px_80px_rgba(24,50,71,0.18)]"
      >
        <div className="mb-5 flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)]",
              tone.iconWrap
            )}
          >
            <FontAwesomeIcon icon={dialogIcon} className="h-5 w-5" />
          </div>

          <div className="space-y-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.16em]",
                tone.badge
              )}
            >
              Konfirmasi Aksi
            </p>
            <h3 id="confirm-dialog-title" className="text-xl font-bold tracking-[-0.01em]">
              {title}
            </h3>
            <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone.confirmVariant}
            icon={dialogIcon}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
