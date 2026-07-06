"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = !mounted
    ? "Mode tema"
    : isDark
      ? "Mode terang"
      : "Mode gelap";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group inline-flex h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)] hover:bg-[var(--card)]"
      aria-label={mounted ? `Aktifkan ${label.toLowerCase()}` : "Memuat tema"}
      title={label}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          mounted && isDark
            ? "bg-[var(--warning-bg)] text-[var(--warning-fg)]"
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}
      >
        <FontAwesomeIcon
          icon={mounted && isDark ? faSun : faMoon}
          className="h-3.5 w-3.5"
        />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">{label}</span>
    </button>
  );
}
