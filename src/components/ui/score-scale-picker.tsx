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
    return "border-[color:var(--success-bg)] bg-[var(--success-bg)] text-[var(--success-fg)]";
  }

  if (score <= midpoint - 2) {
    return "border-[color:var(--danger-bg)] bg-[var(--danger-bg)] text-[var(--danger-fg)]";
  }

  return "border-[color:var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]";
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
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              )}
              aria-pressed={isActive}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span className="rounded-full bg-[var(--danger-bg)] px-2.5 py-1 text-[var(--danger-fg)]">
          1-3 rendah
        </span>
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent-strong)]">
          4-7 cukup
        </span>
        <span className="rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-[var(--success-fg)]">
          8-10 tinggi
        </span>
      </div>
    </div>
  );
}
