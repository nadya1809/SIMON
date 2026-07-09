import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { statLabelClassName } from "@/components/ui/primitive-styles";

type StatCardProps = {
  label: string;
  value: string;
  icon: IconDefinition;
  iconTone?: "blue" | "teal" | "sky" | "soft";
  helper?: string;
  className?: string;
};

const toneClasses = {
  blue: "bg-[var(--accent-soft)] text-[var(--accent)]",
  teal: "bg-[var(--accent-teal-soft)] text-[var(--accent-teal)]",
  sky: "bg-[var(--accent-sky-soft)] text-[var(--accent-sky)]",
  soft: "bg-[var(--surface)] text-[var(--muted)]"
};

export function StatCard({
  label,
  value,
  icon,
  iconTone = "blue",
  helper,
  className
}: StatCardProps) {
  return (
    <SectionCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className={statLabelClassName}>{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold tracking-[-0.03em]">{value}</p>
            {helper ? <span className="pb-1 text-sm text-[var(--muted)]">{helper}</span> : null}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] ${toneClasses[iconTone]}`}
        >
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </div>
      </div>
    </SectionCard>
  );
}
