"use client";

import { toast } from "sonner";

type ConfirmToastOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function showConfirmToast({
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  onConfirm
}: ConfirmToastOptions) {
  const toastId = toast(title, {
    description,
    duration: 12000,
    action: {
      label: confirmLabel,
      onClick: () => {
        void onConfirm();
      }
    },
    cancel: {
      label: cancelLabel,
      onClick: () => {
        toast.dismiss(toastId);
      }
    }
  });

  return toastId;
}
