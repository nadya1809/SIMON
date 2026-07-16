"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheckDouble,
  faCheckCircle,
  faClock,
  faWandSparkles,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type:
    | "RECOMMENDATION_GENERATED"
    | "RECOMMENDATION_PENDING_APPROVAL"
    | "RECOMMENDATION_APPROVED"
    | "RECOMMENDATION_REJECTED"
    | "REMINDER_ASSESSMENT_DAILY";
  title: string;
  message: string;
  href: string | null;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationResponse = {
  data: NotificationItem[];
  meta?: {
    unreadCount?: number;
    limit?: number;
  };
  message?: string;
};

const toneMap = {
  RECOMMENDATION_GENERATED: {
    icon: faWandSparkles,
    iconClass: "text-[var(--accent)] bg-[var(--accent-soft)]"
  },
  RECOMMENDATION_PENDING_APPROVAL: {
    icon: faClock,
    iconClass: "text-[var(--warning-fg)] bg-[var(--warning-bg)]"
  },
  RECOMMENDATION_APPROVED: {
    icon: faCheckCircle,
    iconClass: "text-[var(--success-fg)] bg-[var(--success-bg)]"
  },
  RECOMMENDATION_REJECTED: {
    icon: faTriangleExclamation,
    iconClass: "text-[var(--danger-fg)] bg-[var(--danger-bg)]"
  },
  REMINDER_ASSESSMENT_DAILY: {
    icon: faBell,
    iconClass: "text-[var(--accent-sky)] bg-[var(--accent-sky-soft)]"
  }
} as const;

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications?limit=8", {
        cache: "no-store"
      });
      const result = (await response.json()) as NotificationResponse;

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat notifikasi.");
      }

      setItems(result.data);
      setUnreadCount(result.meta?.unreadCount ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat notifikasi."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const unreadLabel = useMemo(() => {
    if (unreadCount > 9) {
      return "9+";
    }

    return unreadCount.toString();
  }, [unreadCount]);

  async function markAllAsRead() {
    const previousItems = items;
    const previousUnreadCount = unreadCount;

    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    const response = await fetch("/api/notifications/read-all", {
      method: "PATCH"
    });

    if (!response.ok) {
      setItems(previousItems);
      setUnreadCount(previousUnreadCount);
      toast.error("Gagal menandai semua notifikasi sebagai dibaca.");
      return;
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        aria-label="Notifikasi sistem"
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent-strong)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-[95] w-[min(24rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_24px_60px_rgba(18,38,56,0.22)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Notifikasi
              </p>
              <p className="text-xs text-[var(--muted)]">
                {unreadCount} belum dibaca
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void markAllAsRead()}
              disabled={!unreadCount}
            >
              <FontAwesomeIcon icon={faCheckDouble} className="h-3.5 w-3.5" />
              Tandai semua
            </button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                Memuat notifikasi...
              </div>
            ) : items.length ? (
              items.map((item) => {
                const tone = toneMap[item.type];

                return (
                  <Link
                    key={item.id}
                    href={item.targetUrl}
                    prefetch={false}
                    onClick={() => {
                      setOpen(false);
                    }}
                    className={cn(
                      "block rounded-[var(--radius-panel)] border px-3 py-3 transition",
                      item.isRead
                        ? "border-[var(--border)] bg-[var(--surface)]"
                        : "border-[var(--accent)]/30 bg-[var(--accent-soft)]/45"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)]",
                          tone.iconClass
                        )}
                      >
                        <FontAwesomeIcon icon={tone.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.title}
                          </p>
                          {!item.isRead ? (
                            <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                          {item.message}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          {formatNotificationTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                Belum ada notifikasi baru.
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <Link
              href="/notifications"
              prefetch={false}
              className="inline-flex items-center text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              onClick={() => setOpen(false)}
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
