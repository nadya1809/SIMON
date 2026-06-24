"use client";

import Image from "next/image";

type SidebarBrandProps = {
  compact?: boolean;
};

function BpsLogoMark() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-white px-2 shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
      <Image
        src="/logo-bps.svg"
        alt="Logo BPS"
        width={42}
        height={32}
        className="h-auto w-10 object-contain"
        priority
      />
    </div>
  );
}

export function SidebarBrand({ compact = false }: SidebarBrandProps) {
  return (
    <div className="rounded-[var(--radius-panel)] bg-[linear-gradient(145deg,#0f5fa8_0%,#1676c4_46%,#4aa8e8_100%)] p-4 text-white shadow-[0_22px_50px_rgba(21,93,168,0.24)]">
      <div className="flex items-center gap-3">
        <BpsLogoMark />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/76">
            SIMON PST
          </p>
          <h2 className="mt-1 text-lg font-bold leading-tight">
            BPS Provinsi Sumatera Barat
          </h2>
          {compact ? null : (
            <p className="mt-1 text-xs font-medium text-white/74">
              Dashboard internal pelayanan statistik
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
