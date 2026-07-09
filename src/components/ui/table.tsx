import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
};

export function TableContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="table-container" className={cn("overflow-hidden", className)} {...props}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function TableRoot({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      data-slot="table"
      className={cn(
        "min-w-[760px] text-left text-sm md:min-w-full [&_tbody_td]:align-top [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--table-row-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-head"
      className={cn(
        "border-b border-[var(--border)] bg-[var(--table-head-bg)] text-[var(--muted)]",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody data-slot="table-body" className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr data-slot="table-row" className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-header-cell"
      className={cn(
        "px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td data-slot="table-cell" className={className} {...props}>
      {children}
    </td>
  );
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <TableContainer className={className}>
      <TableRoot>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </TableRoot>
    </TableContainer>
  );
}
