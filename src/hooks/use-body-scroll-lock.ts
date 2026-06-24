"use client";

import { useEffect } from "react";

const BODY_LOCK_KEY = "__simonBodyScrollLockCount";

declare global {
  interface Window {
    __simonBodyScrollLockCount?: number;
  }
}

function getLockCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  return window[BODY_LOCK_KEY] ?? 0;
}

function setLockCount(value: number) {
  if (typeof window === "undefined") {
    return;
  }

  window[BODY_LOCK_KEY] = value;
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return;
    }

    const nextCount = getLockCount() + 1;
    const originalOverflow = document.body.style.overflow;

    setLockCount(nextCount);

    if (nextCount === 1) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      const currentCount = getLockCount();
      const remainingCount = Math.max(0, currentCount - 1);

      setLockCount(remainingCount);

      if (remainingCount === 0) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [active]);
}
