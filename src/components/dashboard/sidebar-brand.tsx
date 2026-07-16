"use client";

import Image from "next/image";

type SidebarBrandProps = {
  compact?: boolean;
  collapsed?: boolean;
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

export function SidebarBrand({
  compact = false,
  collapsed = false
}: SidebarBrandProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent-strong)_0%,var(--accent)_62%,#1588d0_100%)] px-5 py-4 text-white shadow-[0_22px_50px_rgba(0,91,154,0.28)]">
      <div
        className={`flex min-w-0 items-center gap-3 ${
          compact ? "min-h-[5rem]" : "min-h-[5.5rem]"
        }`}
      >
        <PstLogoMark />
        <div
          className={`min-w-0 transition-all duration-300 ease-out ${
            collapsed
              ? "w-0 translate-x-2 opacity-0"
              : "w-[11rem] translate-x-0 opacity-100"
          }`}
        >
          <p
            className={`font-black uppercase leading-none tracking-[0.12em] text-white ${
              compact ? "text-[1rem]" : "text-[1.15rem]"
            }`}
          >
            SIMON
          </p>
          <p
            className={`mt-1 font-black uppercase leading-none tracking-[0.06em] text-white/92 ${
              compact ? "text-[1rem]" : "text-[1.15rem]"
            }`}
          >
            PETUGAS PST
          </p>
          <div className="mt-2 h-[2px] w-[11rem] max-w-full rounded-full bg-white/70 shadow-[0_1px_6px_rgba(255,255,255,0.18)]" />
        </div>
      </div>
    </div>
  );
}
