"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        className: "border border-[var(--border)]",
        style: {
          background: "var(--card)",
          color: "var(--foreground)"
        }
      }}
    />
  );
}
