"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaginationBar, type PaginationBarProps } from "@/components/ui/pagination-bar";

type QueryPaginationBarProps = Omit<
  PaginationBarProps,
  "onPageChange" | "onRowsPerPageChange"
> & {
  pageParam?: string;
  rowsPerPageParam?: string;
};

export function QueryPaginationBar({
  page,
  totalPages,
  totalItems,
  rowsPerPage,
  rowsPerPageOptions,
  pageParam = "page",
  rowsPerPageParam = "rowsPerPage"
}: QueryPaginationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateQuery(nextPage: number, nextRowsPerPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(nextPage));
    params.set(rowsPerPageParam, String(nextRowsPerPage));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      totalItems={totalItems}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      onPageChange={(nextPage) => updateQuery(nextPage, rowsPerPage)}
      onRowsPerPageChange={(nextRowsPerPage) => updateQuery(1, nextRowsPerPage)}
    />
  );
}
