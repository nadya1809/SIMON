"use client";

import { cn } from "@/lib/utils";

type ScoreScalePickerProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

function getTone(score: number, min: number, max: number) {
  const midpoint = (min + max) / 2;

  if (score >= midpoint + 2) {
    return "bg-[rgba(33,150,83,0.12)] text-[#157347] border-[rgba(33,150,83,0.2)]";
  }

  if (score <= midpoint - 2) {
    return "bg-[rgba(198,66,66,0.12)] text-[#b64034] border-[rgba(198,66,66,0.18)]";
  }

  return "bg-[rgba(30,136,229,0.1)] text-[var(--accent-strong)] border-[rgba(30,136,229,0.18)]";
}

export function ScoreScalePicker({
  value,
  onChange,
  min = 1,
  max = 10
}: ScoreScalePickerProps) {
  const scores = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {scores.map((score) => {
          const isActive = score === value;

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={cn(
                "flex h-11 items-center justify-center rounded-[var(--radius-control)] border text-sm font-semibold transition",
                isActive
                  ? `${getTone(score, min, max)} shadow-[var(--shadow-sm)]`
                  : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              )}
              aria-pressed={isActive}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span className="rounded-full bg-[rgba(198,66,66,0.08)] px-2.5 py-1 text-[#b64034]">
          1-3 rendah
        </span>
        <span className="rounded-full bg-[rgba(30,136,229,0.08)] px-2.5 py-1 text-[var(--accent-strong)]">
          4-7 cukup
        </span>
        <span className="rounded-full bg-[rgba(33,150,83,0.08)] px-2.5 py-1 text-[#157347]">
          8-10 tinggi
        </span>
      </div>
    </div>
  );
}
