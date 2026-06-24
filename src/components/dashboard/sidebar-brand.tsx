"use client";

type SidebarBrandProps = {
  compact?: boolean;
};

function BpsLogoMark() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
      <svg
        viewBox="0 0 88 88"
        aria-hidden="true"
        className="h-11 w-11 drop-shadow-[0_8px_18px_rgba(15,23,42,0.16)]"
      >
        <rect
          x="14"
          y="18"
          width="22"
          height="46"
          rx="11"
          transform="rotate(18 25 41)"
          fill="#1E88E5"
        />
        <rect
          x="31"
          y="11"
          width="22"
          height="46"
          rx="11"
          transform="rotate(18 42 34)"
          fill="#22C55E"
        />
        <rect
          x="42"
          y="28"
          width="22"
          height="46"
          rx="11"
          transform="rotate(18 53 51)"
          fill="#2563EB"
        />
      </svg>
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
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/82">
        Sistem monitoring kinerja petugas pelayanan statistik terpadu dengan
        tampilan yang bersih, profesional, dan modern.
      </p>
      {compact ? null : (
        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/72">
          <span className="rounded-full border border-white/16 bg-white/12 px-2.5 py-1">
            Statistik Pelayanan
          </span>
          <span className="rounded-full border border-white/16 bg-white/12 px-2.5 py-1">
            Internal Dashboard
          </span>
        </div>
      )}
    </div>
  );
}
