"use client";

import { TimeUnitFilters } from "@/components/dashboard/time-unit-filters";
import type { TimePreset } from "@/lib/time-presets";

type ReportFiltersProps = {
  units: Array<{ id: string; name: string }>;
  officers: Array<{ id: string; name: string; nip: string; unitName: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
    officerId: string;
  };
};

export function ReportFilters({ units, officers, filters }: ReportFiltersProps) {
  return (
    <TimeUnitFilters
      units={units}
      officers={officers}
      filters={filters}
      resetHref="/reports"
    />
  );
}
