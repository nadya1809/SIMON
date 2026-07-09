"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardCheck,
  faFileLines,
  faGaugeHigh,
  faLayerGroup,
  faShieldHalved,
  faTrophy,
  faUsersGear
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Ringkasan kinerja",
    icon: faGaugeHigh
  },
  {
    href: "/assessments",
    label: "Penilaian Harian",
    description: "Input dan pantau penilaian",
    icon: faClipboardCheck
  },
  {
    href: "/units",
    label: "Unit",
    description: "Kelola unit kerja PST",
    icon: faLayerGroup
  },
  {
    href: "/officers",
    label: "Petugas PST",
    description: "Kelola master petugas",
    icon: faUsersGear
  },
  {
    href: "/reward-punishment",
    label: "Evaluasi, Reward, dan Punishment",
    description: "Generate, tinjau, dan putuskan hasil",
    icon: faTrophy
  },
  {
    href: "/reports",
    label: "Laporan",
    description: "Export PDF dan Excel",
    icon: faChartLine
  },
  {
    href: "/settings/criteria",
    label: "Kriteria",
    description: "Kelola struktur penilaian",
    icon: faFileLines
  },
  {
    href: "/settings/users",
    label: "User",
    description: "Kelola akun sistem",
    icon: faShieldHalved
  }
];

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Menu Utama
        </h2>
        <Badge>Internal</Badge>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "block rounded-[var(--radius-panel)] border px-4 py-3 transition",
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-sm)]"
                  : "border-transparent bg-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)]",
                    isActive
                      ? "bg-[var(--card)] text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
