"use client";

import Image from "next/image";

type SidebarBrandProps = {
  compact?: boolean;
};

function PstLogoMark() {
  return (
    <div className="flex h-15 w-11 shrink-0 items-center justify-center">
      <Image
        src="/logo_pst.svg"
        alt="Logo PST"
        width={30}
        height={42}
        className="h-auto w-auto object-contain"
        priority
      />
    </div>
  );
}

export function SidebarBrand({ compact = false }: SidebarBrandProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent-strong)_0%,var(--accent)_62%,#1588d0_100%)] px-4 py-4 text-white shadow-[0_22px_50px_rgba(0,91,154,0.28)]">
      <div
        className={`flex min-w-0 items-center gap-3 ${
          compact ? "min-h-[5rem]" : "min-h-[5.5rem]"
        }`}
      >
        <PstLogoMark />
        <div className="min-w-0">
          <p
            className={`truncate font-black uppercase tracking-[0.24em] text-white ${
              compact ? "text-[1rem]" : "text-[1.15rem]"
            }`}
          >
            SIMON PST
          </p>
          <div className="mt-2 h-[2px] w-[8.6rem] max-w-full rounded-full bg-white/70 shadow-[0_1px_6px_rgba(255,255,255,0.18)]" />
        </div>
      </div>
    </div>
  );
}
