import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { sectionHeaderClassName } from "@/components/ui/primitive-styles";

type DataTableShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export function DataTableShell({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  bodyClassName
}: DataTableShellProps) {
  return (
    <SectionCard data-slot="data-table-shell" className={cn("overflow-hidden", className)}>
      {title || description || actions ? (
        <div data-slot="data-table-header" className={cn(sectionHeaderClassName, headerClassName)}>
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-bold">{title}</h3> : null}
            {description ? (
              <p className="text-sm text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      <div data-slot="data-table-body" className={bodyClassName}>
        {children}
      </div>
    </SectionCard>
  );
}
