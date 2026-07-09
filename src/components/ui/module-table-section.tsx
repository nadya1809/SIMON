import { ReactNode } from "react";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { PaginationBar, type PaginationBarProps } from "@/components/ui/pagination-bar";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ModuleTableSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  headers: string[];
  children: ReactNode;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  tableClassName?: string;
  emptyStateClassName?: string;
};

type ModulePaginationProps = PaginationBarProps & {
  className?: string;
};

export function ModuleTableSection({
  title,
  description,
  actions,
  headers,
  children,
  isEmpty = false,
  emptyState,
  className,
  headerClassName,
  bodyClassName,
  tableClassName,
  emptyStateClassName
}: ModuleTableSectionProps) {
  return (
    <DataTableShell
      title={title}
      description={description}
      actions={actions}
      className={className}
      headerClassName={headerClassName}
      bodyClassName={bodyClassName}
    >
      {isEmpty ? (
        <div className={cn("p-5", emptyStateClassName)}>{emptyState}</div>
      ) : (
        <Table headers={headers} className={tableClassName}>
          {children}
        </Table>
      )}
    </DataTableShell>
  );
}

export function ModulePagination({
  totalItems,
  className,
  ...props
}: ModulePaginationProps) {
  if (!totalItems) {
    return null;
  }

  return (
    <div className={className}>
      <PaginationBar totalItems={totalItems} {...props} />
    </div>
  );
}
