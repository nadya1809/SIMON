"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", description: "Ringkasan kinerja" },
  {
    href: "/assessments",
    label: "Penilaian Harian",
    description: "Input dan pantau penilaian"
  },
  {
    href: "/units",
    label: "Unit",
    description: "Kelola unit kerja PST"
  },
  { href: "/officers", label: "Petugas PST", description: "Kelola master petugas" },
  {
    href: "/reward-punishment",
    label: "Reward & Punishment",
    description: "Rekomendasi dan keputusan"
  },
  { href: "/reports", label: "Laporan", description: "Export PDF dan Excel" },
  {
    href: "/settings/users",
    label: "Pengaturan",
    description: "User dan kriteria"
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Navigasi
        </h2>
        <Badge>Beta</Badge>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-2xl border px-4 py-3 transition",
                isActive
                  ? "border-[var(--accent)] bg-[#eef7ef]"
                  : "border-transparent bg-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]"
              )}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
