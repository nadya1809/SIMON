import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
};

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] text-left text-sm md:min-w-full [&_tbody_td]:align-top [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--table-row-hover)]">
          <thead className="border-b border-[var(--border)] bg-[var(--table-head-bg)] text-[var(--muted)]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
