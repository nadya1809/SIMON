"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheckCircle,
  faCheckDouble,
  faClock,
  faRotateRight,
  faTriangleExclamation,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
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

type NotificationsManagementProps = {
  initialItems: NotificationItem[];
  unreadCount: number;
  role: string;
  infoMessage?: string;
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

export function NotificationsManagement({
  initialItems,
  unreadCount: initialUnreadCount,
  role,
  infoMessage
}: NotificationsManagementProps) {
  const [items, setItems] = useState(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshNotifications() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/notifications?limit=30", {
        cache: "no-store"
      });
      const result = (await response.json()) as {
        data?: NotificationItem[];
        meta?: {
          unreadCount?: number;
        };
        message?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Gagal memuat notifikasi.");
      }

      setItems(result.data);
      setUnreadCount(result.meta?.unreadCount ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat notifikasi."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function markAsRead(notificationId: string) {
    const notification = items.find((item) => item.id === notificationId);

    if (!notification || notification.isRead) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH"
    });

    if (!response.ok) {
      void refreshNotifications();
    }
  }

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
    }
  }

  return (
    <DashboardShell
      title="Notifikasi"
      description="Pantau ringkasan notifikasi sistem, tindak lanjut reward dan punishment, serta status keputusan terbaru dalam satu tempat."
      role={role}
    >
      {infoMessage ? (
        <SectionCard className="border-[var(--warning-fg)]/20 bg-[var(--warning-bg)]/35 p-4 text-sm text-[var(--foreground)]">
          {infoMessage}
        </SectionCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total notifikasi"
          value={`${items.length}`}
          icon={faBell}
          iconTone="sky"
        />
        <StatCard
          label="Belum dibaca"
          value={`${unreadCount}`}
          icon={faClock}
          iconTone="teal"
        />
        <SectionCard className="flex items-center justify-end gap-3 p-5">
          <Button
            type="button"
            variant="secondary"
            icon={faRotateRight}
            onClick={() => void refreshNotifications()}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Memuat ulang..." : "Muat ulang"}
          </Button>
          <Button
            type="button"
            icon={faCheckDouble}
            onClick={() => void markAllAsRead()}
            disabled={!unreadCount}
          >
            Tandai semua dibaca
          </Button>
        </SectionCard>
      </section>

      {items.length ? (
        <SectionCard className="overflow-hidden p-0">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-lg font-bold tracking-[-0.01em]">
              Riwayat notifikasi
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {items.length} notifikasi terbaru untuk akun aktif ini.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {items.map((item) => {
              const tone = toneMap[item.type];

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-4 px-5 py-4 md:flex-row md:items-start md:justify-between",
                    item.isRead ? "bg-transparent" : "bg-[var(--accent-soft)]/35"
                  )}
                >
                  <Link
                    href={item.targetUrl}
                    prefetch={false}
                    className="flex min-w-0 flex-1 gap-3 rounded-[var(--radius-control)] transition hover:opacity-90"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)]",
                        tone.iconClass
                      )}
                    >
                      <FontAwesomeIcon icon={tone.icon} className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--foreground)]">
                          {item.title}
                        </p>
                        {!item.isRead ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {formatNotificationTime(item.createdAt)}
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    {item.targetUrl ? (
                      <Link
                        href={item.targetUrl}
                        prefetch={false}
                        className="inline-flex items-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Buka terkait
                      </Link>
                    ) : null}
                    {!item.isRead ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void markAsRead(item.id)}
                      >
                        Tandai dibaca
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <EmptyState
          title="Belum ada notifikasi"
          description="Saat ada generate data, keputusan reward atau punishment, atau tindak lanjut penting lainnya, notifikasi akan muncul di halaman ini."
          icon="PST"
        />
      )}
    </DashboardShell>
  );
}
