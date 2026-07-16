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

const menuGroups = [
  {
    key: "overview",
    label: "Ringkasan",
    badge: "Live",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Ringkasan kinerja",
        icon: faGaugeHigh
      },
      {
        href: "/reports",
        label: "Laporan",
        description: "Export PDF dan Excel",
        icon: faChartLine
      }
    ]
  },
  {
    key: "operations",
    label: "Operasional",
    badge: "Harian",
    items: [
      {
        href: "/assessments",
        label: "Penilaian Harian",
        description: "Input dan pantau penilaian",
        icon: faClipboardCheck
      },
      {
        href: "/reward-punishment",
        label: "Evaluasi, Reward, dan Punishment",
        description: "Generate, tinjau, dan putuskan hasil",
        icon: faTrophy
      }
    ]
  },
  {
    key: "master",
    label: "Master Data",
    badge: "Data",
    items: [
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
      }
    ]
  },
  {
    key: "settings",
    label: "Pengaturan",
    badge: "Admin",
    items: [
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
    ]
  }
] as const;

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({
  collapsed = false,
  onNavigate
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {menuGroups.map((group) => (
        <div key={group.key} className="space-y-2">
          <div
            className={cn(
              "flex items-center justify-between gap-2",
              collapsed && "justify-center"
            )}
          >
            {!collapsed ? (
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {group.label}
              </h2>
            ) : null}
            <Badge>{group.badge}</Badge>
          </div>
          <nav className="space-y-2">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "block rounded-[var(--radius-panel)] border px-4 py-3 transition",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-sm)]"
                      : "border-transparent bg-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]",
                    collapsed && "px-3"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start gap-3",
                      collapsed && "justify-center"
                    )}
                  >
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
                    {!collapsed ? (
                      <div className="min-w-0">
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.description}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
