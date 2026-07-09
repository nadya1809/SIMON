"use client";

import { TimeUnitFilters } from "@/components/dashboard/time-unit-filters";
import type { TimePreset } from "@/lib/time-presets";

type DashboardFiltersProps = {
  units: Array<{ id: string; name: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
  };
};

export function DashboardFilters({ units, filters }: DashboardFiltersProps) {
  return <TimeUnitFilters units={units} filters={filters} resetHref="/dashboard" />;
}
