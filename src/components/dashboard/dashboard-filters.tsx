import Link from "next/link";
import { DateInput } from "@/components/ui/date-input";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type DashboardFiltersProps = {
  units: Array<{ id: string; name: string }>;
  filters: {
    from: string;
    to: string;
    unitId: string;
  };
};

export function DashboardFilters({ units, filters }: DashboardFiltersProps) {
  return (
    <form
      action="/dashboard"
      className="grid gap-4 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4"
    >
      <FormField label="Dari tanggal">
        <DateInput name="from" defaultValue={filters.from} />
      </FormField>

      <FormField label="Sampai tanggal">
        <DateInput name="to" defaultValue={filters.to} />
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

      <div className="flex items-end gap-3">
        <Button className="flex-1" type="submit">
          Terapkan
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
