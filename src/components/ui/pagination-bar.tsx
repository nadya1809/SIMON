import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export type PaginationBarProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
};

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  rowsPerPage,
  rowsPerPageOptions = [10, 20, 50],
  onPageChange,
  onRowsPerPageChange
}: PaginationBarProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] sm:gap-3">
        <span>Tampilkan</span>
        <Select
          value={String(rowsPerPage)}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-9 w-24"
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <span>data per halaman</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
        <p className="text-sm text-[var(--muted)]">
          {totalItems} data • Halaman {page} dari {totalPages}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={faChevronLeft}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="w-full sm:w-auto"
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={faChevronRight}
            iconPosition="right"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-full sm:w-auto"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
