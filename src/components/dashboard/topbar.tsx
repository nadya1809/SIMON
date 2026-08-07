"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBars,
  faChevronLeft,
  faChevronRight,
  faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";

type TopbarProps = {
  userName: string;
  role: string;
  onMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
  onSidebarCollapseToggle?: () => void;
};

export function Topbar({
  userName,
  role,
  onMenuToggle,
  isSidebarCollapsed = false,
  onSidebarCollapseToggle
}: TopbarProps) {
  return (
    <header className="mb-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)]/96 px-3 py-3 shadow-[var(--shadow-sm)] backdrop-blur sm:px-5 sm:py-4 md:mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] lg:hidden"
            aria-label="Buka menu navigasi"
            onClick={onMenuToggle}
          >
            <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] lg:inline-flex"
            aria-label={
              isSidebarCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"
            }
            onClick={onSidebarCollapseToggle}
          >
            <FontAwesomeIcon
              icon={isSidebarCollapsed ? faChevronRight : faChevronLeft}
              className="h-4 w-4"
            />
            {isSidebarCollapsed ? "Perbesar sidebar" : "Kecilkan sidebar"}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationBell />

          <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-2 py-2 sm:gap-3 sm:px-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent)] sm:flex">
              <FontAwesomeIcon icon={faUserShield} className="h-4 w-4" />
            </div>
            <div className="hidden min-w-0 max-w-[9rem] sm:block sm:max-w-[11rem] md:max-w-none">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <div className="flex items-center gap-2">
                <Badge variant="default">{role}</Badge>
              </div>
            </div>
            <LogoutButton icon={faArrowRightFromBracket} />
          </div>
        </div>
      </div>
    </header>
  );
}
