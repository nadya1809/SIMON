import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";

type DataTableShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DataTableShell({
  title,
  description,
  actions,
  children,
  className
}: DataTableShellProps) {
  return (
    <SectionCard className={cn("overflow-hidden", className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-bold">{title}</h3> : null}
            {description ? (
              <p className="text-sm text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </SectionCard>
  );
}
