import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBars,
  faBell,
  faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";

type TopbarProps = {
  userName: string;
  role: string;
  onMenuToggle?: () => void;
};

export function Topbar({ userName, role, onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 mb-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white/90 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] lg:hidden"
            aria-label="Buka menu navigasi"
            onClick={onMenuToggle}
          >
            <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Notifikasi sistem"
          >
            <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:flex-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <FontAwesomeIcon icon={faUserShield} className="h-4 w-4" />
            </div>
            <div className="min-w-0 max-w-[11rem] sm:max-w-none">
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
