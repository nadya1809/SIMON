import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sectionShellClassName } from "@/components/ui/primitive-styles";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        sectionShellClassName,
        className
      )}
    >
      {children}
    </section>
  );
}
