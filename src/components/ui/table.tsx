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
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface)] text-[var(--muted)]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
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
