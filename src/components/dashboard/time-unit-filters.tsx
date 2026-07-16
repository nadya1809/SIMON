"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FilterActions,
  FilterAutoApplyStatus,
  FilterFields,
  FilterResetLink,
  FilterSelectField,
  ModuleFilters
} from "@/components/ui/module-filters";
import { TIME_PRESET_OPTIONS, type TimePreset } from "@/lib/time-presets";

type TimeUnitFiltersProps = {
  units: Array<{ id: string; name: string }>;
  officers: Array<{ id: string; name: string; nip: string; unitName: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
    officerId: string;
  };
  resetHref: string;
};

export function TimeUnitFilters({
  units,
  officers,
  filters,
  resetHref
}: TimeUnitFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [timePreset, setTimePreset] = useState<TimePreset>(filters.timePreset);
  const [unitId, setUnitId] = useState(filters.unitId);
  const [officerId, setOfficerId] = useState(filters.officerId);
  const filteredOfficers = officers.filter((officer) =>
    unitId ? officer.unitName === units.find((unit) => unit.id === unitId)?.name : true
  );

  function applyFilters(
    nextTimePreset: TimePreset,
    nextUnitId: string,
    nextOfficerId: string
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const paginationKeys = [
      "page",
      "rowsPerPage",
      "rankingPage",
      "rankingRowsPerPage",
      "previewPage",
      "previewRowsPerPage"
    ];

    paginationKeys.forEach((key) => params.delete(key));

    params.set("timePreset", nextTimePreset);

    if (nextUnitId) {
      params.set("unitId", nextUnitId);
    } else {
      params.delete("unitId");
    }

    if (nextOfficerId) {
      params.set("officerId", nextOfficerId);
    } else {
      params.delete("officerId");
    }

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="space-y-0" aria-busy={isPending}>
      <ModuleFilters>
        <FilterFields columnsClassName="md:grid-cols-2 xl:grid-cols-3">
          <FilterSelectField
            label="Filter waktu"
            value={timePreset}
            disabled={isPending}
            onChange={(value) => {
              const nextTimePreset = value as TimePreset;
              setTimePreset(nextTimePreset);
              applyFilters(nextTimePreset, unitId, officerId);
            }}
          >
            {TIME_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelectField>

          <FilterSelectField
            label="Filter unit"
            value={unitId}
            disabled={isPending}
            onChange={(value) => {
              setUnitId(value);
              const selectedOfficerStillVisible = officers.some(
                (officer) =>
                  officer.id === officerId &&
                  (!value ||
                    officer.unitName ===
                      units.find((unit) => unit.id === value)?.name)
              );
              const nextOfficerId = selectedOfficerStillVisible ? officerId : "";
              setOfficerId(nextOfficerId);
              applyFilters(timePreset, value, nextOfficerId);
            }}
          >
            <option value="">Semua unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </FilterSelectField>

          <FilterSelectField
            label="Filter petugas"
            value={officerId}
            disabled={isPending}
            onChange={(value) => {
              setOfficerId(value);
              applyFilters(timePreset, unitId, value);
            }}
          >
            <option value="">Semua petugas</option>
            {filteredOfficers.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officer.name} - {officer.nip} - {officer.unitName}
              </option>
            ))}
          </FilterSelectField>
        </FilterFields>

        <FilterActions>
          <FilterAutoApplyStatus isPending={isPending} />
          <FilterResetLink href={resetHref} disabled={isPending}>
            Reset
          </FilterResetLink>
        </FilterActions>
      </ModuleFilters>
    </div>
  );
}
