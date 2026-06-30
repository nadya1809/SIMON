import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faFilter } from "@fortawesome/free-solid-svg-icons";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
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
  return (
    <form
      action="/dashboard"
      className="space-y-0"
    >
      <FilterToolbar>
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          <FormField label="Filter waktu">
            <Select name="timePreset" defaultValue={filters.timePreset}>
              {TIME_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Filter unit">
            <Select name="unitId" defaultValue={filters.unitId}>
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
          <Button type="submit" icon={faFilter}>
            Terapkan Filter
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--surface)]"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="h-4 w-4" />
            Reset
          </Link>
        </div>
      </FilterToolbar>
    </form>
  );
}
