import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBell,
  faBuildingColumns,
  faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";

type TopbarProps = {
  userName: string;
  role: string;
};

export function Topbar({ userName, role }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 mb-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-white/90 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-white shadow-[var(--shadow-sm)]">
            <FontAwesomeIcon icon={faBuildingColumns} className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              SIMON PST
            </p>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              BPS Provinsi Sumatera Barat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Notifikasi sistem"
          >
            <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <FontAwesomeIcon icon={faUserShield} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
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
