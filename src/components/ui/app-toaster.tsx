"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 5000,
        className:
          "rounded-[var(--radius-panel)] border border-[var(--border)] shadow-[var(--shadow-md)]",
        classNames: {
          toast: "bg-[var(--card)] text-[var(--foreground)]",
          title: "text-sm font-semibold",
          description: "text-[13px] leading-5 text-[var(--muted)]",
          actionButton:
            "!rounded-[var(--radius-control)] !bg-[var(--accent)] !text-white",
          cancelButton:
            "!rounded-[var(--radius-control)] !border !border-[var(--border)] !bg-[var(--surface)] !text-[var(--foreground)]"
        },
        style: {
          background: "var(--card)",
          color: "var(--foreground)"
        }
      }}
    />
  );
}
