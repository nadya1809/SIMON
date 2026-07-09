"use client";

import { TimeUnitFilters } from "@/components/dashboard/time-unit-filters";
import type { TimePreset } from "@/lib/time-presets";

type ReportFiltersProps = {
  units: Array<{ id: string; name: string }>;
  filters: {
    timePreset: TimePreset;
    unitId: string;
  };
};

export function ReportFilters({ units, filters }: ReportFiltersProps) {
  return <TimeUnitFilters units={units} filters={filters} resetHref="/reports" />;
}
