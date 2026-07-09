export type PaginationMeta = {
  page: number;
  rowsPerPage: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedData<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function normalizePositiveInt(value: number | string | null | undefined, fallback: number) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function resolvePaginationParams(
  page: number | string | null | undefined,
  rowsPerPage: number | string | null | undefined,
  defaultRowsPerPage = 10
) {
  return {
    page: normalizePositiveInt(page, 1),
    rowsPerPage: normalizePositiveInt(rowsPerPage, defaultRowsPerPage)
  };
}

export function createPaginationMeta(
  totalItems: number,
  requestedPage: number,
  rowsPerPage: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const page = Math.min(requestedPage, totalPages);

  return {
    page,
    rowsPerPage,
    totalItems,
    totalPages
  };
}
