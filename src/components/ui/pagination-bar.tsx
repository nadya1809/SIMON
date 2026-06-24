import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type PaginationBarProps = {
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
    <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
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

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <p className="text-sm text-[var(--muted)]">
          {totalItems} data • Halaman {page} dari {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={faChevronLeft}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
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
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
