"use client";

import { TimeUnitFilters } from "@/components/dashboard/time-unit-filters";
import type { TimePreset } from "@/lib/time-presets";

type DashboardFiltersProps = {
  units: Array<{ id: string; name: string }>;
  officers: Array<{ id: string; name: string; nip: string; unitName: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
    officerId: string;
  };
};

export function DashboardFilters({
  units,
  officers,
  filters
}: DashboardFiltersProps) {
  return (
    <TimeUnitFilters
      units={units}
      officers={officers}
      filters={filters}
      resetHref="/dashboard"
    />
  );
}
