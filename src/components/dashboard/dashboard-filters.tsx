"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormField } from "@/components/forms/form-field";
import { Select } from "@/components/ui/select";
import { TIME_PRESET_OPTIONS, type TimePreset } from "@/lib/time-presets";

type DashboardFiltersProps = {
  units: Array<{ id: string; name: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
  };
};

export function DashboardFilters({ units, filters }: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [timePreset, setTimePreset] = useState<TimePreset>(filters.timePreset);
  const [unitId, setUnitId] = useState(filters.unitId);

  function applyFilters(nextTimePreset: TimePreset, nextUnitId: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("timePreset", nextTimePreset);

    if (nextUnitId) {
      params.set("unitId", nextUnitId);
    } else {
      params.delete("unitId");
    }

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="space-y-0" aria-busy={isPending}>
      <FilterToolbar>
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          <FormField label="Filter waktu">
            <Select
              name="timePreset"
              value={timePreset}
              disabled={isPending}
              onChange={(event) => {
                const nextTimePreset = event.target.value as TimePreset;
                setTimePreset(nextTimePreset);
                applyFilters(nextTimePreset, unitId);
              }}
            >
              {TIME_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Filter unit">
            <Select
              name="unitId"
              value={unitId}
              disabled={isPending}
              onChange={(event) => {
                const nextUnitId = event.target.value;
                setUnitId(nextUnitId);
                applyFilters(timePreset, nextUnitId);
              }}
            >
              <option value="">Semua unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="flex items-end gap-3 xl:min-w-fit">
          <div className="flex h-11 items-center gap-2 text-sm text-[var(--muted)]">
            <span
              className={`h-2.5 w-2.5 rounded-full transition ${
                isPending
                  ? "animate-pulse bg-[var(--accent)]"
                  : "bg-[var(--success-fg)]"
              }`}
            />
            {isPending ? "Memuat filter..." : "Filter diterapkan otomatis"}
          </div>
          <Link
            href="/dashboard"
            aria-disabled={isPending}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--surface)] ${
              isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <FontAwesomeIcon icon={faRotateLeft} className="h-4 w-4" />
            Reset
          </Link>
        </div>
      </FilterToolbar>
    </div>
  );
}
