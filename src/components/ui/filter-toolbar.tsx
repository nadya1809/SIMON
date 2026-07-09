import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";

type FilterToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <SectionCard
      className={cn("bg-[var(--card-bg-strong)] p-4 md:p-5", className)}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {children}
      </div>
    </SectionCard>
  );
}
