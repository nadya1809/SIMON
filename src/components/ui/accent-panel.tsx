import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";

type AccentPanelProps = {
  children: ReactNode;
  className?: string;
};

export function AccentPanel({ children, className }: AccentPanelProps) {
  return (
    <SectionCard
      className={cn(
        "bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-white",
        className
      )}
    >
      {children}
    </SectionCard>
  );
}
